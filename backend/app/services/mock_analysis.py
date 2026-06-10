"""
Mock analysis results.

Phase 1: Returns realistic-looking mock data so the frontend
can be fully tested before any AI modules are integrated.

Phase 2: Each function will be replaced by a real service call.
The function signatures and return types stay the same — only
the implementation changes.
"""

from app.models.schemas import (
    AnalysisResponse, Finding, SubScore, Recommendations,
    RecommendationItem, RiskLevel, ScamCategory, Severity,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _risk_level(score: int) -> RiskLevel:
    if score <= 25: return RiskLevel.LOW
    if score <= 50: return RiskLevel.MODERATE
    if score <= 75: return RiskLevel.HIGH
    return RiskLevel.CRITICAL


# ─── Mock: full analysis (profile + conversation) ────────────────────────────

def mock_full_analysis(
    has_photo: bool,
    username: str,
    bio: str,
    has_chat: bool,
) -> AnalysisResponse:
    inputs = []
    if has_photo:         inputs.append("profile_photo")
    if username.strip():  inputs.append("username")
    if bio.strip():       inputs.append("bio")
    if has_chat:          inputs.append("conversation")

    identity_score     = 74
    conversation_score = 88
    overall_score      = 83

    findings = [
        Finding(
            tactic_key     = "love_bombing",
            title          = "Love Bombing Detected",
            summary        = "Unusually high frequency of affection statements in early messages.",
            detail         = "Messages from the first five days contain an average of 14 declarations of deep affection per 100 messages, compared to a normal baseline of 2–3 for new acquaintances.",
            evidence       = [
                "\"You are the woman I have been waiting for my whole life.\"",
                "\"I told my daughter about you already — she wants to meet you.\"",
                "\"I have never felt this way about anyone in 48 years of living.\"",
            ],
            explanation    = "Love bombing is a documented manipulation technique used to create rapid emotional dependency. The goal is to make the target feel uniquely special so they are reluctant to question the relationship or refuse later requests.",
            severity       = Severity.HIGH,
            severity_score = 91,
            source         = "conversation",
        ),
        Finding(
            tactic_key     = "financial_pressure",
            title          = "Financial Pressure Detected",
            summary        = "A financial crisis narrative was introduced after 19 days of emotional grooming.",
            detail         = "On day 19 of the conversation, the contact introduced a narrative about a temporary financial problem requiring urgent assistance. This follows a documented grooming-to-exploit timeline where emotional trust is established before any financial topic is raised.",
            evidence       = [
                "\"I am so embarrassed to ask this but I am stuck — the customs office here will release my equipment if I can just cover the fee.\"",
                "\"I will pay you back the moment I land, I promise on my daughter's life.\"",
            ],
            explanation    = "Romance scammers consistently follow a pattern of weeks of emotional investment before introducing a financial request. The delay is intentional — it makes the request feel less suspicious and exploits the emotional bond already formed.",
            severity       = Severity.CRITICAL,
            severity_score = 96,
            source         = "conversation",
        ),
        Finding(
            tactic_key     = "platform_migration",
            title          = "Platform Migration Request",
            summary        = "Contact requested moving to WhatsApp to avoid platform monitoring.",
            detail         = "On day 7, the contact suggested moving the conversation from the dating app to WhatsApp, citing that they \"rarely check this app.\" This is a documented tactic to move communication outside the dating platform's fraud detection systems.",
            evidence       = [
                "\"Can we move to WhatsApp? I never check this app and I don't want to miss your messages.\"",
            ],
            explanation    = "Dating platforms actively monitor for scam patterns and can ban accounts. Moving to WhatsApp or Telegram removes this protection layer and isolates the victim in a less regulated environment.",
            severity       = Severity.MEDIUM,
            severity_score = 78,
            source         = "conversation",
        ),
        Finding(
            tactic_key     = "bio_script_match",
            title          = "Bio Matches Known Scam Script",
            summary        = "The bio contains phrase clusters appearing in 78% of analyzed romance scam profiles.",
            detail         = "NLP analysis of the bio detected a combination of occupation, location, and personal backstory that matches documented romance scam script templates. The specific cluster 'widowed engineer working internationally with one child' appears in the majority of analyzed scam profiles.",
            evidence       = [
                "\"I am a civil engineer currently on a contract in Dubai.\"",
                "\"Widowed 4 years ago — my daughter is my whole world.\"",
                "\"I am looking for a genuine connection, someone honest and God-fearing.\"",
            ],
            explanation    = "Scammers use standardized scripts because they are proven effective. The overseas occupation explains why in-person meetings are impossible; the widowed parent backstory generates sympathy and emotional investment.",
            severity       = Severity.HIGH,
            severity_score = 82,
            source         = "bio",
        ),
        Finding(
            tactic_key     = "image_reuse",
            title          = "Profile Photo Found on Multiple Profiles",
            summary        = "The uploaded photo was found associated with 3 different identities online.",
            detail         = "Reverse image analysis found this photo used on at least 3 separate online profiles under different names. The original photo appears to belong to a different person whose images have been stolen and reused.",
            evidence       = [],
            explanation    = "Profile photo theft is the most common form of romance scam identity fabrication. Scammers steal photos from social media accounts of attractive people, often models or military personnel, who are unlikely to be encountered in the victim's social circle.",
            severity       = Severity.HIGH,
            severity_score = 85,
            source         = "profile_photo",
        ),
    ]

    sub_scores = [
        SubScore(label="Photo Authenticity",    score=82),
        SubScore(label="Username Pattern",      score=45),
        SubScore(label="Bio Script Match",      score=71),
        SubScore(label="Love Bombing",          score=91),
        SubScore(label="Financial Pressure",    score=96),
        SubScore(label="Platform Migration",    score=78),
    ]

    recommendations = Recommendations(
        immediate=[
            RecommendationItem(text="Do not send money, gift cards, or cryptocurrency under any circumstances."),
            RecommendationItem(text="Do not move the conversation to WhatsApp, Telegram, or any private platform."),
            RecommendationItem(
                text="If you have already sent money, contact your bank's fraud line immediately.",
                link="https://www.consumerfinance.gov/consumer-tools/fraud/",
                link_label="CFPB Wire Transfer Fraud Guide",
            ),
        ],
        short_term=[
            RecommendationItem(text="Save screenshots of all conversations and the profile before taking any action."),
            RecommendationItem(
                text="Report this profile to the platform where you met — use the built-in report function.",
            ),
            RecommendationItem(
                text="File a report with the FBI's Internet Crime Complaint Center.",
                link="https://www.ic3.gov",
                link_label="File Report at IC3.gov",
            ),
            RecommendationItem(text="Request a live, unscripted video call. Scammers typically refuse or make excuses."),
        ],
        support=[
            RecommendationItem(
                text="You are not alone — romance scams are designed by professionals to deceive intelligent people.",
                link="/safety-center/romance-scams",
                link_label="Read our Romance Scams Guide",
            ),
            RecommendationItem(
                text="The AARP Fraud Watch Network offers free support for fraud victims.",
                link="https://www.aarp.org/money/scams-fraud/",
                link_label="AARP Fraud Watch Network",
            ),
        ],
    )

    return AnalysisResponse(
        identity_risk_score     = identity_score,
        conversation_risk_score = conversation_score,
        overall_risk_score      = overall_score,
        risk_level              = _risk_level(overall_score),
        scam_category           = ScamCategory.ROMANCE_SCAM,
        narrative_summary       = (
            "The profile photo has been found on multiple identities online, and the bio closely matches "
            "documented romance scam scripts. The conversation shows a textbook grooming progression: "
            "intense love bombing in the first week followed by a financial crisis request on day 19. "
            "Together, these signals are strongly consistent with an active romance scam."
        ),
        findings         = findings,
        sub_scores       = sub_scores,
        recommendations  = recommendations,
        inputs_provided  = inputs,
        confidence_level = 88,
    )


# ─── Mock: profile only ───────────────────────────────────────────────────────

def mock_profile_analysis(
    has_photo: bool,
    username: str,
    bio: str,
) -> AnalysisResponse:
    inputs = []
    if has_photo:        inputs.append("profile_photo")
    if username.strip(): inputs.append("username")
    if bio.strip():      inputs.append("bio")

    score = 68

    findings = [
        Finding(
            tactic_key     = "bio_script_match",
            title          = "Bio Contains Known Scam Phrases",
            summary        = "Multiple phrases in this bio match documented romance scam templates.",
            detail         = "The bio contains the phrase cluster 'engineer working abroad' combined with 'widowed' and 'looking for genuine connection' — a combination that appears in 73% of analyzed romance scam profiles in our training data.",
            evidence       = [
                "\"Civil engineer currently working abroad on a contract.\"",
                "\"Widowed — my daughter is everything to me.\"",
            ],
            explanation    = "Scam scripts are reused because they reliably generate empathy and lower suspicion. The professional occupation abroad explains unavailability; the single-parent backstory generates emotional connection.",
            severity       = Severity.HIGH,
            severity_score = 73,
            source         = "bio",
        ),
        Finding(
            tactic_key     = "username_pattern",
            title          = "Username Matches Suspicious Pattern",
            summary        = "Username follows a pattern common in synthetically generated accounts.",
            detail         = "The username combines a common English first name with a random 4-digit number suffix. This pattern is seen in 61% of flagged accounts in our dataset.",
            evidence       = [],
            explanation    = "Authentic users typically choose meaningful usernames. Random number suffixes often indicate rapid account creation, shared account templates, or automated account generation.",
            severity       = Severity.MEDIUM,
            severity_score = 55,
            source         = "username",
        ),
    ]

    sub_scores = [
        SubScore(label="Photo Authenticity", score=72 if has_photo else None),
        SubScore(label="Username Pattern",   score=55),
        SubScore(label="Bio Script Match",   score=73),
    ]

    recommendations = Recommendations(
        immediate=[
            RecommendationItem(text="Request a spontaneous, unscripted video call before proceeding further."),
            RecommendationItem(text="Do a manual reverse image search on the profile photo using Google Images or TinEye."),
        ],
        short_term=[
            RecommendationItem(text="Look for inconsistencies between the bio claims and details shared in conversation."),
            RecommendationItem(text="Search the exact bio text in quotes in Google to find duplicate profiles."),
        ],
        support=[
            RecommendationItem(
                text="Learn how to verify online identities in our Safety Center.",
                link="/safety-center/catfishing",
                link_label="Catfishing Guide",
            ),
        ],
    )

    return AnalysisResponse(
        identity_risk_score     = score,
        conversation_risk_score = None,
        overall_risk_score      = score,
        risk_level              = _risk_level(score),
        scam_category           = ScamCategory.FAKE_IDENTITY,
        narrative_summary       = (
            "The profile bio contains multiple phrases strongly associated with romance scam scripts, "
            "and the username follows a pattern common in synthetic accounts. "
            "We recommend verifying this person's identity through a live video call before sharing any personal information."
        ),
        findings         = findings,
        sub_scores       = sub_scores,
        recommendations  = recommendations,
        inputs_provided  = inputs,
        confidence_level = 65,
    )


# ─── Mock: conversation only ──────────────────────────────────────────────────

def mock_conversation_analysis(has_chat: bool) -> AnalysisResponse:
    score = 88

    findings = [
        Finding(
            tactic_key     = "love_bombing",
            title          = "Love Bombing Detected",
            summary        = "Extreme density of affection language in early conversation.",
            detail         = "Messages from the first week contain declarations of deep love and future planning that are statistically abnormal for a new acquaintance. Frequency of affection statements is 7× the baseline for this conversation stage.",
            evidence       = [
                "\"I have never felt this connection with anyone before — it scares me how real this is.\"",
                "\"I am already planning what we will do when I visit.\"",
            ],
            explanation    = "Love bombing is used to rapidly accelerate emotional intimacy and create a sense of destiny or unique connection. Once the target feels deeply bonded, they are far more likely to comply with unusual requests.",
            severity       = Severity.HIGH,
            severity_score = 89,
            source         = "conversation",
        ),
        Finding(
            tactic_key     = "financial_pressure",
            title          = "Financial Request Detected",
            summary        = "A request for financial assistance was embedded in a crisis narrative.",
            detail         = "The conversation contains a request for money framed as a temporary emergency. The request follows a documented pattern: crisis introduced → urgency created → personal obligation invoked.",
            evidence       = [
                "\"I hate asking this but I am completely stuck — could you lend me just enough to cover the shipping fee?\"",
                "\"I promise I will return it the moment this contract is done next week.\"",
            ],
            explanation    = "Financial requests embedded in crisis narratives are the core revenue mechanism of romance scams. The 'loan' framing reduces perceived risk to the victim.",
            severity       = Severity.CRITICAL,
            severity_score = 95,
            source         = "conversation",
        ),
        Finding(
            tactic_key     = "urgency_creation",
            title          = "Urgency Tactics Detected",
            summary        = "Artificial time pressure used to prevent careful decision-making.",
            detail         = "Multiple messages contain deadline language designed to prevent the target from pausing to verify the request or consult others.",
            evidence       = [
                "\"The customs office closes today — I need to know by this afternoon.\"",
                "\"If this doesn't go through today I will lose the entire contract.\"",
            ],
            explanation    = "Urgency creation is a classic social engineering tactic. When people feel time pressure, they bypass careful analysis and rely on emotional responses — exactly what the scammer needs.",
            severity       = Severity.HIGH,
            severity_score = 83,
            source         = "conversation",
        ),
    ]

    sub_scores = [
        SubScore(label="Love Bombing",          score=89),
        SubScore(label="Financial Pressure",    score=95),
        SubScore(label="Urgency Creation",      score=83),
        SubScore(label="Platform Migration",    score=40),
        SubScore(label="Isolation Tactics",     score=22),
    ]

    recommendations = Recommendations(
        immediate=[
            RecommendationItem(text="Do not send any money. This includes bank transfers, gift cards, and cryptocurrency."),
            RecommendationItem(text="Stop responding to urgency pressure — legitimate requests can always wait."),
        ],
        short_term=[
            RecommendationItem(text="Save all conversation evidence (screenshots) before taking any further action."),
            RecommendationItem(
                text="Report this conversation to the FBI IC3.",
                link="https://www.ic3.gov",
                link_label="IC3 Report",
            ),
        ],
        support=[
            RecommendationItem(
                text="Read our full guide on recognizing and responding to financial scam tactics.",
                link="/safety-center/financial-scams",
                link_label="Financial Scams Guide",
            ),
        ],
    )

    return AnalysisResponse(
        identity_risk_score     = None,
        conversation_risk_score = score,
        overall_risk_score      = score,
        risk_level              = _risk_level(score),
        scam_category           = ScamCategory.ROMANCE_SCAM,
        narrative_summary       = (
            "The conversation shows a textbook scam progression: intense early love bombing to build emotional dependency, "
            "followed by a financial crisis request using urgency tactics to prevent careful thinking. "
            "These three patterns together are strongly consistent with an active romance scam."
        ),
        findings         = findings,
        sub_scores       = sub_scores,
        recommendations  = recommendations,
        inputs_provided  = ["conversation"],
        confidence_level = 91,
    )


# ─── Mock: clean / low-risk result ───────────────────────────────────────────

def mock_clean_result() -> AnalysisResponse:
    return AnalysisResponse(
        identity_risk_score     = 18,
        conversation_risk_score = None,
        overall_risk_score      = 18,
        risk_level              = RiskLevel.LOW,
        scam_category           = ScamCategory.LIKELY_SAFE,
        narrative_summary       = (
            "No significant fraud signals were detected in the provided information. "
            "The profile appears consistent with a genuine online identity. "
            "As always, trust your instincts and proceed with the usual caution when meeting new people online."
        ),
        findings    = [],
        sub_scores  = [
            SubScore(label="Photo Authenticity", score=15),
            SubScore(label="Username Pattern",   score=10),
            SubScore(label="Bio Script Match",   score=20),
        ],
        recommendations = Recommendations(
            immediate  = [],
            short_term = [
                RecommendationItem(text="Continue to exercise standard caution with any online contact."),
                RecommendationItem(text="Always verify identity through a live, unscripted video call before meeting in person."),
            ],
            support = [
                RecommendationItem(
                    text="Learn about general online safety in our Safety Center.",
                    link="/safety-center",
                    link_label="Safety Center",
                ),
            ],
        ),
        inputs_provided  = ["profile_photo", "username", "bio"],
        confidence_level = 72,
    )
