"""
Analysis API routes — Phase 3 (Unified Multimodal AI Pipeline).

Active modules:
  - Conversation NLP:    ONNX DistilBERT              (live)
  - GAN/Liveness detect: ProfileImageAnalyzer ONNX    (live)
  - Profile forensics:   ProfileAnalyzer regex + ELA  (live)
  - OCR:                 OcrService EasyOCR            (live)
  - XAI:                 XaiExplainer SHAP             (live when risk > 15)
"""

import asyncio
import base64
import logging
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.core.config import settings
from app.models.schemas import (
    AnalysisResponse,
    Finding,
    HealthResponse,
    Recommendations,
    RecommendationItem,
    RiskLevel,
    ScamCategory,
    Severity,
    SubScore,
    TokenWeight,
)
from app.services.conversation_analyzer import ConversationAnalyzer, ConversationResult
from app.services.image_analyzer import ProfileImageAnalyzer
from app.services.mock_analysis import mock_clean_result
from app.services.ocr_service import OcrService
from app.services.profile_analyzer import ProfileAnalyzer
from app.services.xai_service import XaiExplainer

logger = logging.getLogger(__name__)

router = APIRouter(prefix=settings.api_prefix, tags=["analysis"])

ALLOWED_IMAGE_TYPES  = {"image/jpeg", "image/png", "image/webp", "image/heic"}
MAX_FILE_BYTES       = settings.max_file_size_mb * 1024 * 1024

# Minimum fake_probability (0-100) returned by the liveness ONNX model that
# triggers the Critical override.  Lower = more sensitive; 60 catches
# adversarial edge-cases (goggles, reflections, heavy filters) that the
# stricter 85 threshold missed.
IMAGE_RISK_THRESHOLD = 60

# ─── Singletons — loaded once at startup via main.py lifespan ─────────────────
analyzer       = ConversationAnalyzer()
image_analyzer = ProfileImageAnalyzer()


# ─── Dependencies ─────────────────────────────────────────────────────────────

def get_analyzer() -> ConversationAnalyzer:
    if not analyzer.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Conversation analysis model is unavailable. "
                "Check startup logs for ONNX loading errors."
            ),
        )
    return analyzer


# ─── Shared helpers ───────────────────────────────────────────────────────────

async def _validate_image(file: UploadFile, max_bytes: int = MAX_FILE_BYTES) -> bytes:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported type '{file.content_type}'.",
        )
    data = await file.read()
    await file.seek(0)
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_file_size_mb} MB limit.",
        )
    return data


def _make_photo_data_url(image_bytes: bytes, content_type: str) -> str:
    """
    Convert raw image bytes into a Base64 data URL suitable for an <img src>.
    Falls back to image/jpeg if content_type is not recognised.
    """
    safe_type = content_type if content_type in ALLOWED_IMAGE_TYPES else "image/jpeg"
    encoded   = base64.b64encode(image_bytes).decode("ascii")
    return f"data:{safe_type};base64,{encoded}"


def _risk_level_from_score(score: int) -> RiskLevel:
    if score <= 25: return RiskLevel.LOW
    if score <= 50: return RiskLevel.MODERATE
    if score <= 75: return RiskLevel.HIGH
    return RiskLevel.CRITICAL


def _severity_from_score(score: int) -> Severity:
    if score >= 85: return Severity.CRITICAL
    if score >= 65: return Severity.HIGH
    if score >= 40: return Severity.MEDIUM
    return Severity.LOW


# ─── GAN / liveness hook ──────────────────────────────────────────────────────

async def _run_image_analysis(
    has_photo:   bool,
    image_bytes: bytes,
) -> Optional[Finding]:
    """
    Run the ONNX liveness/GAN detector on the uploaded profile photo.

    This function is intentionally score-free: it detects and reports,
    but does NOT mutate any score dict.  All score decisions — both the
    micro Photo Authenticity bar value and the macro identity_score — are
    made explicitly in the caller immediately after this returns, using a
    dedicated ``final_photo_score`` local variable.  This eliminates the
    previous shallow-copy mutation trap where photo_result["score"] was
    set inside _run_image_analysis but the identity_score weighted blend
    sometimes ran against a stale copy of the dict, leaving the bar and
    the ring out of sync.

    Returns
    -------
    Finding | None
        A Critical-severity Finding if fake_probability >= IMAGE_RISK_THRESHOLD,
        else None.  The caller uses ``gan_finding is not None`` as the
        ``gan_detected`` flag that gates all downstream score overrides.
    """
    if not has_photo or not image_analyzer.is_loaded:
        return None

    try:
        fake_probability = await image_analyzer.analyze_image(image_bytes)
        logger.info("GAN detector: fake_probability=%d%%", fake_probability)

        if fake_probability >= IMAGE_RISK_THRESHOLD:
            return Finding(
                tactic_key    ="gan_face_detected",
                title         ="AI-Generated Face Detected (GAN / Liveness Fail)",
                summary       =(
                    f"Profile photo matched structural patterns of GAN-synthesized faces "
                    f"with {fake_probability}% confidence."
                ),
                detail        =(
                    f"The liveness ONNX model (liveness_targeted.onnx) assigned a fake "
                    f"probability of {fake_probability}% to this image. "
                    "GAN-generated faces — most commonly produced by models such as "
                    "StyleGAN or DALL-E — exhibit distinctive frequency artifacts in the "
                    "latent feature space that are imperceptible to the human eye but "
                    "detectable by a classifier trained on real vs. synthetic face datasets. "
                    "Profile photos of this type are strongly associated with catfishing, "
                    "romance scams, and fake identity profiles."
                ),
                evidence      =[
                    f"Liveness model confidence: {fake_probability}% fake",
                    f"Threshold for Critical override: {IMAGE_RISK_THRESHOLD}%",
                ],
                explanation   =(
                    "Scammers use GAN-generated faces because they are not findable by "
                    "conventional reverse image search — there is no original photo to trace. "
                    "Liveness / anti-spoofing classifiers detect these images by learning "
                    "the statistical fingerprints left by generative models during synthesis."
                ),
                severity      =Severity.CRITICAL,
                severity_score=fake_probability,
                source        ="profile_photo",
            )

        return None   # below threshold — no override, no extra finding

    except Exception as exc:
        logger.error("GAN/liveness detection failed (non-fatal): %s", exc)
        return None


# ─── Task-scam heuristic ──────────────────────────────────────────────────────

_TASK_SCAM_KEYWORDS = [
    "review", "pays", "commission", "usdt", "telegram",
    "merchant", "task", "salary", "vip", "google doc",
    "google review", "amazon review", "like and subscribe",
    "crypto wallet", "withdraw", "deposit required",
]


def _check_task_scam(text: str) -> tuple[bool, list[str]]:
    lower   = text.lower()
    matched = [kw for kw in _TASK_SCAM_KEYWORDS if kw in lower]
    return len(matched) >= 2, matched


# ─── Recommendations library ──────────────────────────────────────────────────

_RECOMMENDATIONS: dict[str, Recommendations] = {
    "Financial Scam": Recommendations(
        immediate=[
            RecommendationItem(text="Do not send money, gift cards, cryptocurrency, or wire transfers to this contact."),
            RecommendationItem(
                text="If you have already sent money, call your bank's fraud line immediately.",
                link="https://www.consumerfinance.gov/consumer-tools/fraud/",
                link_label="CFPB Wire Transfer Guide",
            ),
        ],
        short_term=[
            RecommendationItem(text="Save all conversation screenshots as evidence before blocking."),
            RecommendationItem(text="Report the profile to the platform where contact was initiated."),
            RecommendationItem(text="File a report with the FBI Internet Crime Complaint Center.", link="https://www.ic3.gov", link_label="FBI IC3"),
        ],
        support=[
            RecommendationItem(text="Read our financial scam guide for recovery steps.", link="/safety-center/financial-scams", link_label="Financial Scams Guide"),
        ],
    ),
    "Sextortion": Recommendations(
        immediate=[
            RecommendationItem(text="Do not pay any demanded amount — payment escalates demands, it never ends them."),
            RecommendationItem(text="Do not share any further intimate content."),
        ],
        short_term=[
            RecommendationItem(text="Screenshot and preserve all threat messages as evidence."),
            RecommendationItem(text="Report to the FBI — sextortion is a federal crime.", link="https://www.ic3.gov", link_label="FBI IC3"),
            RecommendationItem(text="Use StopNCII to hash content and prevent further spread.", link="https://stopncii.org", link_label="StopNCII.org"),
        ],
        support=[
            RecommendationItem(text="Step-by-step response guide in our Safety Center.", link="/safety-center/sextortion", link_label="Sextortion Guide"),
        ],
    ),
    "Blackmail": Recommendations(
        immediate=[
            RecommendationItem(text="Do not comply with demands — compliance signals vulnerability."),
            RecommendationItem(text="Document all threats with timestamps before blocking the contact."),
        ],
        short_term=[
            RecommendationItem(text="Report to local law enforcement — blackmail is a criminal offence."),
            RecommendationItem(text="File a cybercrime report.", link="https://www.ic3.gov", link_label="FBI IC3"),
        ],
        support=[
            RecommendationItem(text="Victim Connect provides confidential support.", link="https://victimconnect.org", link_label="Victim Connect"),
        ],
    ),
    "Task Scam": Recommendations(
        immediate=[
            RecommendationItem(text="Stop completing tasks immediately — you will never receive the promised payout."),
            RecommendationItem(text="Do not deposit any funds to 'unlock' earnings — this is the core mechanism of the scam."),
        ],
        short_term=[
            RecommendationItem(text="Report the Telegram channel / WhatsApp group to the platform."),
            RecommendationItem(text="File a report with the FTC.", link="https://reportfraud.ftc.gov", link_label="FTC Report Fraud"),
        ],
        support=[
            RecommendationItem(text="Learn how task scams operate and escalate.", link="/safety-center/financial-scams", link_label="Financial Scams Guide"),
        ],
    ),
    "Safe": Recommendations(
        immediate=[],
        short_term=[
            RecommendationItem(text="No significant scam signals detected. Continue with standard caution for new online contacts."),
            RecommendationItem(text="Verify identity via a spontaneous, unscripted live video call before sharing personal information."),
        ],
        support=[
            RecommendationItem(text="Learn about general online safety warning signs.", link="/safety-center", link_label="Safety Center"),
        ],
    ),
}

# ─── Emoji Behavioral Heuristics ──────────────────────────────────────────────

# Romance / Love Bombing: Manufacturing intimacy, future faking, extreme affection
_ROMANCE_EMOJIS    = {
    "❤️", "💕", "💖", "💘", "💓", "💞", "💗", 
    "😘", "😍", "🥰", "😚", "💋", 
    "🌹", "🌷", "💐", 
    "💍", "👰", "🤵", "👑", "💎",
    "🥂", "🍷", "✈️", "🌍", "🔐"
}

# Sextortion: Explicit requests, secrecy, sexual references
_SEXTORTION_EMOJIS = {
    "🍑", "🍆", "💦", "👅", "🔥", "🥵",
    "📸", "🎥", "📹", "📷", 
    "🤫", "🔒", "😏", "😉", "😈"
}

# Blackmail / Urgency: Threats, time pressure, exposure
_BLACKMAIL_EMOJIS  = {
    "⚠️", "🚨", "❗", "‼️", "📢", "😡", 
    "⏰", "⏳", 
    "💰", "💵", "💸", 
    "👨‍👩‍👧‍👦", "👨‍👩‍👦", "📲" 
}

def _check_emoji_signals(text: str) -> tuple[bool, str, list[str]]:
    """
    Scans text for high-risk emoji clusters across different scam vectors.
    Returns: (triggered: bool, scam_type: str, matched_emojis: list)
    """
    romance_matches    = [char for char in text if char in _ROMANCE_EMOJIS]
    sextortion_matches = [char for char in text if char in _SEXTORTION_EMOJIS]
    blackmail_matches  = [char for char in text if char in _BLACKMAIL_EMOJIS]
    
    # We check in order of severity/immediacy
    # 1. Blackmail / Threat (High severity, strong indicator if clustered)
    if len(blackmail_matches) >= 3:
        return True, "Blackmail", list(set(blackmail_matches))
        
    # 2. Sextortion (Explicit requests + secrecy)
    # Even 2 emojis from this list combined is a strong signal
    if len(sextortion_matches) >= 2:
        return True, "Sextortion", list(set(sextortion_matches))
    
    # 3. Romance Scam / Love Bombing (Requires a higher threshold, e.g., 4+)
    if len(romance_matches) >= 4:
        return True, "Romance Scam", list(set(romance_matches))
        
    return False, "", []
# ─── Profile findings builder ─────────────────────────────────────────────────

def _build_profile_findings(
    photo_result:    dict,
    username_result: dict,
    bio_result:      dict,
    has_photo:       bool,
    username:        str,
    bio:             str,
) -> list[Finding]:
    findings = []

    # Photo ELA — threshold 30 (base 20, anything above means a signal fired)
    if has_photo and photo_result["score"] > 30:
        findings.append(Finding(
            tactic_key    ="photo_anomaly",
            title         ="Profile Photo Texture Anomaly",
            summary       ="Image forensic analysis detected patterns inconsistent with natural photography.",
            detail        =photo_result["finding"],
            evidence      =[],
            explanation   =(
                "Generative AI images and digitally manipulated photos show abnormal texture "
                "frequency profiles measurable via compression analysis. Scammers frequently "
                "steal photos of real people or use AI-generated faces to build fake identities."
            ),
            severity      =_severity_from_score(photo_result["score"]),
            severity_score=photo_result["score"],
            source        ="profile_photo",
        ))

    # Username — threshold 40
    if username and username.strip() and username_result["score"] >= 40:
        findings.append(Finding(
            tactic_key    ="username_pattern",
            title         ="Username Matches Synthetic Generation Pattern",
            summary       ="Username structure is consistent with automated account creation.",
            detail        =username_result["finding"],
            evidence      =[username],
            explanation   =(
                "Scam farms generate thousands of accounts programmatically. A distinctive "
                "marker is a real-sounding first name followed by 4+ random digits, or strings "
                "with unusually low vowel ratios — both indicate non-organic account creation."
            ),
            severity      =_severity_from_score(username_result["score"]),
            severity_score=username_result["score"],
            source        ="username",
        ))

    # Bio — threshold 30
    if bio and bio.strip() and bio_result["score"] >= 30:
        findings.append(Finding(
            tactic_key    ="bio_script",
            title         ="Bio Matches Known Scam Script",
            summary       ="Profile text contains phrase clusters from documented fraud templates.",
            detail        =bio_result["finding"],
            evidence      =[bio[:400]] if bio else [],
            explanation   =(
                "Romance and financial scammers use standardized scripts because they are "
                "proven effective at scale. The combination of an overseas occupation, "
                "widowed backstory, and emotional trust language appears in the majority "
                "of documented romance scam profiles."
            ),
            severity      =_severity_from_score(bio_result["score"]),
            severity_score=bio_result["score"],
            source        ="bio",
        ))

    return findings


# ─── Conversation findings builder ───────────────────────────────────────────

def _build_conversation_findings(
    conv_result:     ConversationResult,
    task_triggered:  bool,
    task_matches:    list[str],
    emoji_triggered: bool,           # Added parameter
    emoji_scam_type: str,            # Added parameter
    matched_emojis:  list[str],      # Added parameter
) -> list[Finding]:
    findings  = []
    score     = conv_result.risk_score
    predicted = conv_result.predicted_class

    if predicted != "Safe":
        _detail_map = {
            "Financial Scam": (
                "financial_pressure",
                "Financial Scam Pattern Detected",
                "Conversation contains language strongly associated with financial fraud.",
                (
                    "The DistilBERT classifier identified a combination of linguistic patterns "
                    "highly predictive of financial scam behavior — including emotional framing "
                    "of monetary requests, crisis narratives, and urgency language designed to "
                    "bypass careful decision-making."
                ),
                (
                    "Romance and financial scammers follow a documented script: weeks of emotional "
                    "investment followed by a fabricated crisis requiring money. The patterns here "
                    "match thousands of documented fraud cases in the training data."
                ),
            ),
            "Sextortion": (
                "sextortion_signal",
                "Sextortion / Coercive Content Detected",
                "Conversation contains language associated with intimate coercion or sextortion.",
                (
                    "The classifier detected language characteristic of sextortion — pressure "
                    "language, threats, demands for compliance, and framing around intimate images "
                    "or personal information used as leverage."
                ),
                (
                    "Sextortion perpetrators typically establish contact, build brief trust, "
                    "obtain or claim to have intimate content, then issue threats. Early detection "
                    "maximises the victim's options for response."
                ),
            ),
            "Blackmail": (
                "coercive_control",
                "Blackmail / Coercive Threat Detected",
                "Conversation contains language consistent with blackmail or coercive threats.",
                (
                    "The classifier found language patterns matching blackmail scripts: threats "
                    "to expose information, demands for compliance, and language designed to "
                    "isolate the target from support networks."
                ),
                (
                    "Blackmail rarely ends with compliance — it typically escalates. "
                    "Non-compliance combined with evidence preservation and reporting is the "
                    "recommended response."
                ),
            ),
        }

        if predicted in _detail_map:
            key, title, summary, detail, explanation = _detail_map[predicted]
            findings.append(Finding(
                tactic_key    =key,
                title         =title,
                summary       =summary,
                detail        =detail,
                evidence      =[],
                explanation   =explanation,
                severity      =_severity_from_score(score),
                severity_score=score,
                source        ="conversation",
            ))

    if task_triggered:
        findings.append(Finding(
            tactic_key    ="task_scam_heuristic",
            title         ="Task / Job Scam Detected",
            summary       ="Conversation matched keyword clusters from known task/job scam scripts.",
            detail        =(
                f"The heuristic scanner detected {len(task_matches)} co-occurring task-scam "
                f"keywords: {', '.join(task_matches)}. Task scams promise easy income for "
                "simple digital tasks (writing reviews, liking posts, rating apps). They build "
                "false trust with small payouts, then demand a 'deposit' to unlock larger tasks — "
                "the deposit is never returned."
            ),
            evidence      =task_matches,
            explanation   =(
                "Task scams are among the fastest-growing fraud categories. They operate primarily "
                "via Telegram and WhatsApp. Victims are initially paid small amounts to build "
                "trust, then are gradually manipulated into depositing funds they can never withdraw."
            ),
            severity      =Severity.CRITICAL,
            severity_score=95,
            source        ="conversation",
        ))

    # FIXED: Indentation is now correct so it only evaluates if emojis were actually found
    if emoji_triggered:
        _emoji_explanations = {
            "Blackmail": (
                "Threat/Urgency Emojis Detected",
                "Conversation contains emoji clusters associated with threats, deadlines, or demands.",
                f"The heuristic scanner detected an abnormal cluster of urgency/threat emojis: {' '.join(matched_emojis)}. Scammers use these to manufacture panic, threatening to expose victims or contact their families unless a ransom is paid.",
                "High-pressure tactics are designed to force immediate compliance before the victim can seek help."
            ),
            "Sextortion": (
                "Coercive/Explicit Emojis Detected",
                "Conversation contains emoji clusters associated with intimate demands and secrecy.",
                f"The heuristic scanner detected a cluster of explicit or coercive emojis: {' '.join(matched_emojis)}. Sextortionists frequently use these specific emojis to request intimate media while demanding secrecy.",
                "These specific emoji combinations are heavily over-indexed in documented sextortion scripts."
            ),
            "Romance Scam": (
                "Love Bombing Emojis Detected",
                "Conversation contains excessive affection/future-faking emojis.",
                f"The heuristic scanner detected an overwhelming cluster of affection/intimacy emojis: {' '.join(matched_emojis)}. Romance scammers use extreme emoji clustering (love bombing) early in a conversation to artificially manufacture intimacy.",
                "Rapid escalation of intimacy ('love bombing') is the primary tactic used to bypass critical thinking in romance fraud."
            )
        }

        if emoji_scam_type in _emoji_explanations:
            title, summary, detail, explanation = _emoji_explanations[emoji_scam_type]
            findings.append(Finding(
                tactic_key    ="behavioral_risk",  
                title         =title,
                summary       =summary,
                detail        =detail,
                evidence      =matched_emojis,
                explanation   =explanation,
                severity      =Severity.HIGH,
                severity_score=85,
                source        ="conversation",
            ))

    for label, prob in conv_result.scores.items():
        if label == predicted or label == "Safe" or prob < 0.15:
            continue
        secondary_score = round(prob * 100)
        findings.append(Finding(
            tactic_key    =f"{label.lower().replace(' ', '_')}_secondary",
            title         =f"Secondary Signal: {label} Language Present",
            summary       =f"Some {label.lower()} language was also detected alongside the primary signal.",
            detail        =(
                f"The {label} classifier assigned {secondary_score}% probability. "
                "This indicates mixed tactics may be present in the conversation."
            ),
            evidence      =[],
            explanation   ="Scam categories frequently overlap — for example, sextortionists may also request payment.",
            severity      =_severity_from_score(secondary_score),
            severity_score=secondary_score,
            source        ="conversation",
        ))

    return findings


# ─── XAI extraction ───────────────────────────────────────────────────────────
def _run_xai(conv_analyzer: ConversationAnalyzer, text: str) -> list[TokenWeight]:
    try:
        session   = getattr(conv_analyzer, "_session",   None)
        tokenizer = getattr(conv_analyzer, "_tokenizer", None)

        if session is None or tokenizer is None:
            logger.warning("XAI: session or tokenizer not available.")
            return []

        # NEW SAFEGUARD: If the text is ONLY emojis/symbols, skip SHAP to prevent crashes
        if not re.search(r'[a-zA-Z0-9]', text):
            logger.info("XAI: No alphanumeric words found, skipping SHAP.")
            return []

        words = text.split()
        if len(words) > 150:
            text = " ".join(words[:150])
            logger.info("XAI: Text truncated to 150 words for performance.")

        xai_engine  = XaiExplainer(tokenizer, session)
        raw_weights = xai_engine.get_token_attributions(text)

        return [
            TokenWeight(
                word       =item.get("word", ""),
                weight     =float(item.get("weight", 0.0)),
                is_trigger =bool(item.get("is_trigger", False)),
            )
            for item in raw_weights
        ]
    except Exception as exc:
        logger.error("XAI attribution failed (non-fatal): %s", exc)
        return []
# ─── Narrative builder ────────────────────────────────────────────────────────

def _build_narrative(
    overall_score:   int,
    identity_score:  int,
    conv_score:      Optional[int],
    predicted_class: Optional[str],
    task_triggered:  bool,
    gan_detected:    bool = False,
) -> str:
    
    # Create a unified score string to inject into all narratives
    convo_display = f"{conv_score}" if conv_score is not None else "--"
    score_str = f"(identity risk: {identity_score}/100, convo risk: {convo_display}/100, overall: {overall_score}/100)"

    if task_triggered:
        return (
            f"This conversation shows strong indicators of a Task / Job Scam {score_str}. "
            "Keyword clusters associated with task-based fraud were detected. "
            "These scams promise easy income for small digital tasks, then manipulate victims into depositing funds they cannot recover."
        )

    if gan_detected:
        return (
            f"The profile photo was classified as AI-generated or GAN-synthesized with high confidence {score_str}. "
            "This is a strong indicator of a fake identity — scammers use AI-generated faces because "
            "they cannot be found by reverse image search. Do not share personal information with this contact."
        )

    if conv_score is not None and conv_score > 50 and predicted_class and predicted_class != "Safe":
        return (
            f"This conversation contains high-risk language patterns consistent with {predicted_class} {score_str}. "
            "Profile identity signals were also analyzed and are detailed in the findings below."
        )

    if identity_score > 50:
        return (
            f"The profile identity signals indicate elevated risk {score_str}. "
            "Structural and textual patterns in the username and/or bio match documented fraud profiles. "
            + ("No significant conversation risk was detected." if conv_score is not None and conv_score <= 25 else "")
        )

    return (
        f"No significant fraud signals were detected in this analysis {score_str}. "
        "The inputs provided did not match patterns in our fraud detection models. "
        "Continue with standard caution — a low score does not guarantee safety."
    )


# ─── ScamCategory mapper ──────────────────────────────────────────────────────

def _map_to_scam_category(
    predicted_class: Optional[str],
    task_triggered:  bool,
    overall_score:   int,
    identity_score:  int,
    gan_detected:    bool = False,
    emoji_triggered: bool = False,       # NEW
    emoji_scam_type: str = "",           # NEW
) -> ScamCategory:
    if task_triggered:
        return ScamCategory.TASK_SCAM
    if gan_detected:
        return ScamCategory.FAKE_IDENTITY
        
    # NEW: Let emojis override the top-level category
    if emoji_triggered:
        if emoji_scam_type == "Romance Scam": return ScamCategory.ROMANCE_SCAM
        if emoji_scam_type == "Sextortion":   return ScamCategory.SEXTORTION
        if emoji_scam_type == "Blackmail":    return ScamCategory.SOCIAL_ENGINEERING

    mapping = {
        "Financial Scam": ScamCategory.FINANCIAL_SCAM,
        "Sextortion":     ScamCategory.SEXTORTION,
        "Blackmail":      ScamCategory.SOCIAL_ENGINEERING,
    }
    if predicted_class in mapping:
        return mapping[predicted_class]
    if overall_score > 50 and identity_score > 50:
        return ScamCategory.FAKE_IDENTITY
    if overall_score > 25:
        return ScamCategory.ROMANCE_SCAM
    return ScamCategory.LIKELY_SAFE


# ─── Sub-scores builder ───────────────────────────────────────────────────────

def _build_sub_scores(
    photo_score:    Optional[int],
    username_score: Optional[int],
    bio_score:      Optional[int],
    conv_scores:    Optional[dict],
    has_photo:      bool,
    has_username:   bool,
    has_bio:        bool,
    has_conv:       bool,
    task_triggered: bool = False,
    emoji_triggered: bool = False, # NEW
    emoji_scam_type: str = "",     # NEW
) -> list[SubScore]:
    subs = []

    if has_photo:
        subs.append(SubScore(label="Photo Authenticity", score=photo_score, is_safety_score=False))
    if has_username:
        subs.append(SubScore(label="Username Pattern",   score=username_score, is_safety_score=False))
    if has_bio:
        subs.append(SubScore(label="Bio Script Match",   score=bio_score, is_safety_score=False))
    if conv_scores and has_conv:
            for label, prob in conv_scores.items():
                if task_triggered and label == "Safe":
                    subs.append(SubScore(label=label, score=0, is_safety_score=True))
                else:
                    is_safety = (label == "Safe")
                    score_val = round(prob * 100)
                    
                    # --- THE MERGE LOGIC ---
                    # If the emoji scanner caught the exact same category, take the highest score!
                    if emoji_triggered and label == emoji_scam_type:
                        score_val = max(score_val, 85)
                        
                    subs.append(SubScore(label=label, score=score_val, is_safety_score=is_safety))
                
            if task_triggered:
                subs.append(SubScore(label="Task / Job Scam", score=95, is_safety_score=False))
            
        # NOTE: We removed the standalone 'if emoji_triggered:' append block 
        # so it no longer creates a duplicate bar at the bottom!

    return subs


# ─── Recommendations selector ────────────────────────────────────────────────

def _select_recommendations(
    predicted_class: Optional[str],
    task_triggered:  bool,
    overall_score:   int,
    gan_detected:    bool = False,
) -> Recommendations:
    if task_triggered:
        return _RECOMMENDATIONS["Task Scam"]
    if gan_detected or (predicted_class is None and overall_score > 50):
        return _RECOMMENDATIONS["Financial Scam"]
    if predicted_class in _RECOMMENDATIONS:
        return _RECOMMENDATIONS[predicted_class]
    if overall_score > 50:
        return _RECOMMENDATIONS["Financial Scam"]
    return _RECOMMENDATIONS["Safe"]


# ─── Health ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, summary="Health check")
async def health_check():
    conv_status  = "onnx-live" if analyzer.is_loaded       else "unavailable"
    image_status = "onnx-live" if image_analyzer.is_loaded else "unavailable"
    return HealthResponse(
        status  ="healthy",
        version ="3.0.0",
        modules ={
            "profile_forensics": "live",
            "gan_liveness":      image_status,
            "ocr_pipeline":      "live",
            "conversation_nlp":  conv_status,
            "xai_attributions":  "live",
            "risk_scoring":      "weighted-blend",
        },
    )


# ─── Full analysis ────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=AnalysisResponse,
    summary="Full multimodal analysis",
)
async def full_analysis(
    profile_photo:    Optional[UploadFile]  = File(None),
    username:         Optional[str]         = Form(None),
    bio:              Optional[str]         = Form(None),
    chat_text:        Optional[str]         = Form(None),
    chat_screenshots: List[UploadFile]      = File(default=[]),
    conv_analyzer:    ConversationAnalyzer  = Depends(get_analyzer),
):
    # ── Normalise inputs ──────────────────────────────────────────────────────
    username  = (username  or "").strip()
    bio       = (bio       or "").strip()
    chat_text = (chat_text or "").strip()

    has_photo       = bool(profile_photo and profile_photo.filename)
    has_username    = bool(username)
    has_bio         = bool(bio)
    has_text        = bool(chat_text)
    has_screenshots = bool(chat_screenshots and any(f.filename for f in chat_screenshots))
    has_chat        = has_text or has_screenshots
    has_profile     = has_photo or has_username or has_bio

    if not has_profile and not has_chat:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide at least one input: photo, username, bio, or chat text.",
        )

    # ── Validate files ────────────────────────────────────────────────────────
    image_bytes: bytes = b""
    if has_photo:
        image_bytes = await _validate_image(profile_photo)

    screenshot_list = []
    if has_screenshots:
        valid_screenshots = [f for f in chat_screenshots if f.filename]
        if len(valid_screenshots) > settings.max_screenshots:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Maximum {settings.max_screenshots} screenshots allowed.",
            )
        for ss in valid_screenshots:
            await _validate_image(ss, max_bytes=5 * 1024 * 1024)
        screenshot_list = valid_screenshots

    # ── Profile analysis (ELA + regex) ───────────────────────────────────────
    profile_engine  = ProfileAnalyzer()
    photo_result    = await profile_engine.analyze_photo(profile_photo if has_photo else None)
    username_result = profile_engine.analyze_username(username if has_username else None)
    bio_result      = profile_engine.analyze_bio(bio if has_bio else None)

    # ── GAN / liveness detection hook ────────────────────────────────────────
    # _run_image_analysis is now score-free — it returns a Finding (or None)
    # but never touches any score dict.  All score decisions are made here,
    # with explicit local variables so nothing can silently go stale.
    gan_finding  = await _run_image_analysis(has_photo, image_bytes)
    gan_detected = gan_finding is not None

    # ── Identity score + final_photo_score (micro bar value) ─────────────────
    # final_photo_score is the single authoritative value passed to
    # _build_sub_scores for the Photo Authenticity bar.  We set it
    # independently of photo_result so the ELA dict is never mutated and
    # the bar and the Identity Risk ring are always derived from the same
    # number in the same branch, eliminating the desync.
    if gan_detected:
        final_photo_score = 100   # micro: Photo Authenticity bar  → 100/100
        identity_score    = 100   # macro: Identity Risk ring       → 100/100
    else:
        final_photo_score = photo_result["score"] if has_photo else None
        photo_contrib    = photo_result["score"]    * 0.40 if has_photo    else 0
        bio_contrib      = bio_result["score"]      * 0.40 if has_bio      else 0
        username_contrib = username_result["score"] * 0.20 if has_username else 0
        provided_weight  = (0.40 if has_photo else 0) + (0.40 if has_bio else 0) + (0.20 if has_username else 0)

        if provided_weight > 0:
            identity_score = round((photo_contrib + bio_contrib + username_contrib) / provided_weight)
            identity_score = min(max(identity_score, 0), 100)
        else:
            identity_score = 0

    # ── OCR ───────────────────────────────────────────────────────────────────
    ocr_text = ""
    if has_screenshots:
        try:
            ocr_engine = OcrService()
            ocr_text   = await ocr_engine.extract_text_from_screenshots(screenshot_list)
        except Exception as exc:
            logger.error("OCR failed (non-fatal): %s", exc)

    unified_text = chat_text
    if ocr_text:
        unified_text = f"{unified_text}\n\n{ocr_text}".strip() if unified_text else ocr_text

# ─── Conversation analysis ─────────────────────────────────────────────────
    conv_result:       Optional[ConversationResult] = None
    conv_score:        int  = 0
    task_triggered:    bool = False
    task_matches:      list = []
    word_attributions: list[TokenWeight] = []
    
    # ADD THESE 3 DEFAULT VARIABLES:
    emoji_triggered:   bool = False
    emoji_scam_type:   str  = ""
    matched_emojis:    list = []

    if has_chat and unified_text.strip():
        conv_result    = await conv_analyzer.analyze(unified_text)
        conv_score     = conv_result.risk_score

        task_triggered, task_matches = _check_task_scam(unified_text)
        
        # ADD THIS LINE TO ACTUALLY RUN THE EMOJI SCANNER:
        emoji_triggered, emoji_scam_type, matched_emojis = _check_emoji_signals(unified_text)

        if task_triggered:
            conv_score = max(conv_score, 95)

        if conv_score > 15:
            word_attributions = _run_xai(conv_analyzer, unified_text)
        # # TURN OFF SHAP TEMPORARILY: Change 'conv_score > 15' to 'False'
        # if False: 
        #     word_attributions = _run_xai(conv_analyzer, unified_text)
    elif has_chat and not unified_text.strip():
        logger.warning("Chat input provided but unified_text is empty after OCR.")

    # ── Overall score ─────────────────────────────────────────────────────────
    if has_profile and has_chat:
        overall_score = round(identity_score * 0.40 + conv_score * 0.60)
    elif has_profile:
        overall_score = identity_score
    else:
        overall_score = conv_score

    overall_score = min(max(overall_score, 0), 100)

    # ── Assemble findings ─────────────────────────────────────────────────────
    profile_findings = _build_profile_findings(
        photo_result, username_result, bio_result,
        has_photo, username, bio,
    )

    # Inject the GAN finding immediately after the ELA findings so it appears
    # in the sorted list near the top (severity_score = fake_probability ≥ 86).
    if gan_finding is not None:
        profile_findings.append(gan_finding)

    conv_findings = []
    if conv_result is not None:
        conv_findings = _build_conversation_findings(conv_result, task_triggered, task_matches, emoji_triggered, emoji_scam_type, matched_emojis)

    all_findings = sorted(
        profile_findings + conv_findings,
        key=lambda f: f.severity_score,
        reverse=True,
    )

    # ── Inputs provided ───────────────────────────────────────────────────────
    inputs_provided = []
    if has_photo:       inputs_provided.append("profile_photo")
    if has_username:    inputs_provided.append("username")
    if has_bio:         inputs_provided.append("bio")
    if has_text:        inputs_provided.append("chat_text")
    if has_screenshots: inputs_provided.append("conversation")

    predicted_class = conv_result.predicted_class if conv_result else None
    confidence      = round(conv_result.confidence * 100) if conv_result else 75

    # Build Base64 data URL so the frontend can render the analyzed face.
    photo_data_url: str | None = (
        _make_photo_data_url(image_bytes, profile_photo.content_type)
        if has_photo and image_bytes
        else None
    )

    return AnalysisResponse(
        identity_risk_score      =identity_score if has_profile else None,
        conversation_risk_score  =conv_score      if has_chat    else None,
        overall_risk_score       =overall_score,
        risk_level               =_risk_level_from_score(overall_score),
        
        # 1. Update scam_category to include the emoji variables
        scam_category            =_map_to_scam_category(
            predicted_class, 
            task_triggered, 
            overall_score, 
            identity_score, 
            gan_detected=gan_detected,
            emoji_triggered=emoji_triggered,
            emoji_scam_type=emoji_scam_type
        ),
        
        narrative_summary        =_build_narrative(overall_score, identity_score, conv_score if has_chat else None, predicted_class, task_triggered, gan_detected),
        findings                 =all_findings,
        
        # 2. Update sub_scores to include the emoji variables
        sub_scores               =_build_sub_scores(
            final_photo_score,
            username_result["score"] if has_username else None,
            bio_result["score"]      if has_bio      else None,
            conv_result.scores       if conv_result  else None,
            has_photo, has_username, has_bio, has_chat,
            task_triggered=task_triggered,
            emoji_triggered=emoji_triggered,
            emoji_scam_type=emoji_scam_type
        ),
        
        recommendations          =_select_recommendations(predicted_class, task_triggered, overall_score, gan_detected),
        conversation_attributions=word_attributions,
        inputs_provided          =inputs_provided,
        analysis_version         ="3.0.0",
        confidence_level         =confidence,
        analyzed_username        =username or None,
        analyzed_bio             =bio      or None,
        extracted_text           =unified_text or None,
        uploaded_photo_base64    =photo_data_url,
    )


# ─── Profile-only ─────────────────────────────────────────────────────────────

@router.post(
    "/analyze/profile",
    response_model=AnalysisResponse,
    summary="Profile-only analysis",
)
async def profile_only_analysis(
    profile_photo: Optional[UploadFile] = File(None),
    username:      Optional[str]        = Form(None),
    bio:           Optional[str]        = Form(None),
):
    username = (username or "").strip()
    bio      = (bio      or "").strip()
    has_photo    = bool(profile_photo and profile_photo.filename)
    has_username = bool(username)
    has_bio      = bool(bio)

    if not has_photo and not has_username and not has_bio:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide at least one profile input.",
        )

    image_bytes: bytes = b""
    if has_photo:
        image_bytes = await _validate_image(profile_photo)

    engine          = ProfileAnalyzer()
    photo_result    = await engine.analyze_photo(profile_photo if has_photo else None)
    username_result = engine.analyze_username(username if has_username else None)
    bio_result      = engine.analyze_bio(bio if has_bio else None)

    # ── GAN / liveness detection hook ────────────────────────────────────────
    gan_finding  = await _run_image_analysis(has_photo, image_bytes)
    gan_detected = gan_finding is not None

    # ── Identity score + final_photo_score (micro bar value) ─────────────────
    if gan_detected:
        final_photo_score = 100   # micro: Photo Authenticity bar  → 100/100
        identity_score    = 100   # macro: Identity Risk ring       → 100/100
    else:
        final_photo_score = photo_result["score"] if has_photo else None
        photo_contrib    = photo_result["score"]    * 0.40 if has_photo    else 0
        bio_contrib      = bio_result["score"]      * 0.40 if has_bio      else 0
        username_contrib = username_result["score"] * 0.20 if has_username else 0
        provided_weight  = (0.40 if has_photo else 0) + (0.40 if has_bio else 0) + (0.20 if has_username else 0)

        identity_score = round((photo_contrib + bio_contrib + username_contrib) / provided_weight)
        identity_score = min(max(identity_score, 0), 100)

    findings = _build_profile_findings(
        photo_result, username_result, bio_result,
        has_photo, username, bio,
    )
    if gan_finding is not None:
        findings.append(gan_finding)

    findings = sorted(findings, key=lambda f: f.severity_score, reverse=True)

    inputs_provided = []
    if has_photo:    inputs_provided.append("profile_photo")
    if has_username: inputs_provided.append("username")
    if has_bio:      inputs_provided.append("bio")

    photo_data_url: str | None = (
        _make_photo_data_url(image_bytes, profile_photo.content_type)
        if has_photo and image_bytes
        else None
    )

    return AnalysisResponse(
        identity_risk_score      =identity_score,
        conversation_risk_score  =None,
        overall_risk_score       =identity_score,
        risk_level               =_risk_level_from_score(identity_score),
        scam_category            =_map_to_scam_category(None, False, identity_score, identity_score, gan_detected),
        narrative_summary        =_build_narrative(identity_score, identity_score, None, None, False, gan_detected),
        findings                 =findings,
        sub_scores               =_build_sub_scores(
            final_photo_score,                          # authoritative micro bar value
            username_result["score"] if has_username else None,
            bio_result["score"]      if has_bio      else None,
            None, has_photo, has_username, has_bio, False,
        ),
        recommendations          =_select_recommendations(None, False, identity_score, gan_detected),
        conversation_attributions=[],
        inputs_provided          =inputs_provided,
        analysis_version         ="3.0.0",
        confidence_level         =75,
        analyzed_username        =username or None,
        analyzed_bio             =bio      or None,
        extracted_text           =None,
        uploaded_photo_base64    =photo_data_url,
    )


# ─── Conversation-only ────────────────────────────────────────────────────────

@router.post(
    "/analyze/conversation",
    response_model=AnalysisResponse,
    summary="Conversation-only analysis",
)
async def conversation_only_analysis(
    chat_text:        Optional[str]        = Form(None),
    chat_screenshots: List[UploadFile]     = File(default=[]),
    conv_analyzer:    ConversationAnalyzer = Depends(get_analyzer),
):
    chat_text = (chat_text or "").strip()
    has_text        = bool(chat_text)
    has_screenshots = bool(chat_screenshots and any(f.filename for f in chat_screenshots))

    if not has_text and not has_screenshots:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide chat text or at least one screenshot.",
        )

    if has_screenshots:
        valid = [f for f in chat_screenshots if f.filename]
        if len(valid) > settings.max_screenshots:
            raise HTTPException(status_code=422, detail=f"Maximum {settings.max_screenshots} screenshots.")
        for ss in valid:
            await _validate_image(ss, max_bytes=5 * 1024 * 1024)

    ocr_text = ""
    if has_screenshots:
        try:
            ocr_engine = OcrService()
            ocr_text   = await ocr_engine.extract_text_from_screenshots(
                [f for f in chat_screenshots if f.filename]
            )
        except Exception as exc:
            logger.error("OCR failed: %s", exc)

    unified = chat_text
    if ocr_text:
        unified = f"{unified}\n\n{ocr_text}".strip() if unified else ocr_text

    if not unified.strip():
        raise HTTPException(status_code=422, detail="No usable text extracted from the provided input.")
    
    conv_result    = await conv_analyzer.analyze(unified)
    conv_score     = conv_result.risk_score
    
    task_triggered, task_matches = _check_task_scam(unified)
    
    # ADD THIS LINE:
    emoji_triggered, emoji_scam_type, matched_emojis = _check_emoji_signals(unified)
    
    if task_triggered:
        conv_score = max(conv_score, 95)

    if emoji_triggered:
            conv_score = max(conv_score, 85)

    word_attributions: list[TokenWeight] = []
    if conv_score > 15:
        word_attributions = _run_xai(conv_analyzer, unified)

    # AND MAKE SURE THIS CALL HAS ALL THE NEW VARIABLES:
    findings = _build_conversation_findings(
        conv_result, 
        task_triggered, 
        task_matches, 
        emoji_triggered, 
        emoji_scam_type, 
        matched_emojis
    )

    inputs_provided = []
    if has_text:        inputs_provided.append("chat_text")
    if has_screenshots: inputs_provided.append("conversation")

    return AnalysisResponse(
        identity_risk_score      =None,
        conversation_risk_score  =conv_score,
        overall_risk_score       =conv_score,
        risk_level               =_risk_level_from_score(conv_score),
        
        scam_category            =_map_to_scam_category(
            conv_result.predicted_class, 
            task_triggered, 
            conv_score, 
            0, 
            gan_detected=False, 
            emoji_triggered=emoji_triggered, 
            emoji_scam_type=emoji_scam_type
        ),

        narrative_summary        =_build_narrative(conv_score, 0, conv_score, conv_result.predicted_class, task_triggered),
        findings                 =findings,
        sub_scores               =_build_sub_scores(
            None, None, None, conv_result.scores, 
            False, False, False, True, 
            task_triggered=task_triggered,
            emoji_triggered=emoji_triggered,
            emoji_scam_type=emoji_scam_type
        ),
        recommendations          =_select_recommendations(conv_result.predicted_class, task_triggered, conv_score),
        conversation_attributions=word_attributions,
        inputs_provided          =inputs_provided,
        analysis_version         ="3.0.0",
        confidence_level         =round(conv_result.confidence * 100),
        extracted_text           =unified or None,
    )


# ─── Demo endpoints ───────────────────────────────────────────────────────────

@router.get("/analyze/demo/clean", response_model=AnalysisResponse, summary="Demo: clean result")
async def demo_clean():
    return mock_clean_result()


@router.get("/analyze/demo/high-risk", response_model=AnalysisResponse, summary="Demo: high-risk result")
async def demo_high_risk():
    from app.services.mock_analysis import mock_full_analysis
    return mock_full_analysis(has_photo=True, username="james_engineer1987", bio="Civil engineer in Dubai, widowed.", has_chat=True)
