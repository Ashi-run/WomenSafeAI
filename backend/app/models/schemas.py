from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    LOW      = "Low Risk"
    MODERATE = "Moderate Risk"
    HIGH     = "High Risk"
    CRITICAL = "Critical Risk"
    UNKNOWN  = "Unknown"


class ScamCategory(str, Enum):
    ROMANCE_SCAM           = "Romance Scam"
    CATFISHING             = "Catfishing"
    SEXTORTION             = "Sextortion"
    FINANCIAL_SCAM         = "Financial Scam"
    FAKE_IDENTITY          = "Fake Identity"
    EMOTIONAL_MANIPULATION = "Emotional Manipulation"
    SOCIAL_ENGINEERING     = "Social Engineering"
    TASK_SCAM              = "Task / Job Scam"
    LIKELY_SAFE            = "No Significant Flags"
    UNKNOWN                = "Unknown"


class Severity(str, Enum):
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    CRITICAL = "critical"


# ─── Finding (single detected signal) ────────────────────────────────────────

class Finding(BaseModel):
    tactic_key:      str       = Field(..., description="Machine-readable key, e.g. 'love_bombing'")
    title:           str       = Field(..., description="Human-readable signal name")
    summary:         str       = Field(..., description="One-sentence description")
    detail:          str       = Field(..., description="Full explanation of what was found")
    evidence:        List[str] = Field(default_factory=list, description="Quoted excerpts from input")
    explanation:     str       = Field(..., description="Why this tactic is used / why it matters")
    severity:        Severity
    severity_score:  int       = Field(..., ge=0, le=100, description="Confidence 0–100")
    source:          str       = Field(..., description="Which input triggered this: photo/username/bio/conversation")


# ─── Sub-score breakdown ──────────────────────────────────────────────────────

class SubScore(BaseModel):
    label:          str
    score:          Optional[int] = Field(None, ge=0, le=100)
    # When True the score is a "safety" metric — high value means SAFE,
    # not risky. The frontend inverts its colour logic for these.
    is_safety_score: bool = Field(False, description="If True, a high score means safe (invert colour logic)")


# ─── XAI token weight (SHAP / gradient attribution) ──────────────────────────

class TokenWeight(BaseModel):
    word:       str   = Field(..., description="The token / word from the input text")
    weight:     float = Field(..., description="Normalised attribution weight, 0.0–1.0")
    is_trigger: bool  = Field(False, description="True if this token was a key driver of the scam classification")


# ─── Recommendation item ──────────────────────────────────────────────────────

class RecommendationItem(BaseModel):
    text:       str
    link:       Optional[str] = None
    link_label: Optional[str] = None


class Recommendations(BaseModel):
    immediate:  List[RecommendationItem] = Field(default_factory=list)
    short_term: List[RecommendationItem] = Field(default_factory=list)
    support:    List[RecommendationItem] = Field(default_factory=list)


# ─── Main analysis response ───────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    # Scores
    identity_risk_score:     Optional[int] = Field(None, ge=0, le=100)
    conversation_risk_score: Optional[int] = Field(None, ge=0, le=100)
    overall_risk_score:      int           = Field(..., ge=0, le=100)

    # Classification
    risk_level:    RiskLevel
    scam_category: ScamCategory

    # Narrative
    narrative_summary: str = Field(..., description="2–3 sentence plain-language summary")

    # Detailed findings
    findings:   List[Finding]
    sub_scores: List[SubScore]

    # Recommendations
    recommendations: Recommendations

    # XAI attributions — populated when conversation text is present and
    # risk_score > 15. Empty list when not applicable.
    conversation_attributions: List[TokenWeight] = Field(
        default_factory=list,
        description="Per-token SHAP attribution weights for the conversation input"
    )

    # Metadata
    inputs_provided:  List[str] = Field(default_factory=list)
    analysis_version: str       = "3.0.0"
    confidence_level: int       = Field(..., ge=0, le=100)

    # Optional: echo back the analyzed text inputs so the frontend can display
    # them in context (e.g. the XAI highlighter needs the original chat text).
    analyzed_username: Optional[str] = Field(None, description="Username that was analyzed")
    analyzed_bio:      Optional[str] = Field(None, description="Bio text that was analyzed")
    extracted_text:    Optional[str] = Field(None, description="Chat text (pasted or OCR-extracted)")

    # Base64-encoded data URL of the uploaded profile photo (e.g.
    # "data:image/jpeg;base64,/9j/4AAQ..."). Populated only when a photo
    # was uploaded.  Allows the frontend to render the analyzed face
    # alongside the results without a second HTTP round-trip.
    uploaded_photo_base64: Optional[str] = Field(None, description="Base64 data-URL of the uploaded profile photo")


# ─── Health response ──────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:  str
    version: str
    modules: Dict[str, str]
