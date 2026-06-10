"""
ProfileAnalyzer
===============
Local, dependency-free profile forensics using:
  - Regex script matching on bio text
  - Structural heuristics on username
  - OpenCV Laplacian variance for photo ELA approximation

All three methods return a dict with at least {"score": int, "finding": str}.
Scores are 0–100. The caller (analysis.py) is responsible for weighting.
"""

import re
import logging
from typing import Optional, Dict, Any, List

import cv2
import numpy as np
from fastapi import UploadFile

logger = logging.getLogger(__name__)

import os
from google.cloud import vision

# Tell Python where your free Google API key is located
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "google_vision_key.json"

def detect_stolen_photo_web(image_bytes: bytes) -> dict:
    """
    Uses Google Cloud Vision to search the entire internet for the uploaded profile photo.
    If it finds the exact photo on other websites, it flags it as a stolen identity.
    """
    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)

        # Call the Web Detection API
        response = client.web_detection(image=image)
        web_detection = response.web_detection
        
        score_penalty = 0
        signals = []

        # 1. Check for Exact Image Matches on the internet
        if web_detection.full_matching_images:
            match_count = len(web_detection.full_matching_images)
            if match_count > 0:
                score_penalty += 60 # Massive penalty for a stolen photo!
                signals.append(f"Reverse image search found this exact photo on {match_count} other websites (Stolen Identity Risk).")

        # 2. Check what Google thinks is in the photo (Web Entities)
        suspicious_tags = ["model", "actor", "stock photography", "celebrity", "influencer"]
        if web_detection.web_entities:
            for entity in web_detection.web_entities:
                if entity.description and entity.description.lower() in suspicious_tags:
                    score_penalty += 30
                    signals.append(f"Web entity match: Photo is associated with '{entity.description}'.")
                    break 

        return {"web_penalty": score_penalty, "web_signals": signals}

    except Exception as exc:
        logger.error(f"Google Vision API skipped or failed: {exc}")
        return {"web_penalty": 0, "web_signals": []}
# ─── Scam phrase library ──────────────────────────────────────────────────────
# Patterns are sorted roughly by discrimination power (most distinctive first).
# Each match adds to the score independently so co-occurring phrases compound.

_SCAM_PHRASES: List[str] = [
    # Occupation/location combos — strongest single signal
    r"working abroad",
    r"oil\s*rig",
    r"military deployment",
    r"peacekeeping\s*mission",
    r"ocean\s*engineer",
    r"offshore\s*(contract|project|platform)",
    # Widowed + child — second strongest cluster
    r"widowed",
    r"lost\s+my\s+(spouse|wife|husband|partner)",
    r"single\s+parent",
    r"daughter\s+is\s+my\s+(whole\s+)?world",
    r"son\s+is\s+my\s+(whole\s+)?world",
    # Trust / relationship scripts
    r"looking\s+for\s+genuine",
    r"honest\s+relationship",
    r"god.fearing",
    r"distance\s+is\s+not\s+a\s+problem",
    r"trust\s+is\s+everything",
    r"serious\s+relationship\s+only",
    r"not\s+here\s+to\s+play\s+games",
    # Contract work narratives
    r"contract\s+working",
    r"on\s+a\s+contract",
    r"civil\s+engineer",
]


class ProfileAnalyzer:

    # ── Username analysis ─────────────────────────────────────────────────────

    def analyze_username(self, username: Optional[str]) -> Dict[str, Any]:
        """
        Structural heuristics for automated/synthetic account detection.

        Scoring rationale:
          - Base 0 (no free points — a clean username should score near 0)
          - +50 for 4+ digit numeric suffix (strongest synthetic signal)
          - +25 for low vowel ratio (character entropy / unnatural consonant clusters)
          - +15 for excessive length (>18 chars is unusual for real names)
          - cap at 100
        """
        if not username or not username.strip():
            return {"score": 0, "finding": "No username provided.", "signals": []}

        username = username.strip()
        score    = 0
        signals  = []

        # 1. Numeric suffix — most reliable synthetic generation signal
        #    Matches: john1987, james_smith4521, mike9876
        if re.search(r"[a-zA-Z]{2,}[_\-]?[0-9]{4,}$", username):
            score += 50
            signals.append("4+ digit numeric suffix — consistent with automated account generation.")

        # 2. Low vowel ratio — random character strings have few vowels
        letters   = re.findall(r"[a-zA-Z]", username)
        if len(letters) >= 4:
            vowels = sum(1 for c in letters if c.lower() in "aeiou")
            ratio  = vowels / len(letters)
            if ratio < 0.20:
                score += 25
                signals.append(f"Low vowel ratio ({ratio:.0%}) — unnatural consonant grouping.")

        # 3. Excessive length
        if len(username) > 18:
            score += 15
            signals.append(f"Username length {len(username)} chars — unusually long for organic accounts.")

        score = min(score, 100)

        if score >= 50:
            finding = (
                f"Username '{username}' matches structural patterns of synthetic/automated accounts "
                f"(signals: {'; '.join(signals)})."
            )
        else:
            finding = f"Username '{username}' presents an organic layout with no strong synthetic markers."

        return {"score": score, "finding": finding, "signals": signals}

    # ── Bio analysis ──────────────────────────────────────────────────────────

    def analyze_bio(self, bio: Optional[str]) -> Dict[str, Any]:
        """
        Regex-based script matching against a curated library of romance/
        financial scam phrases.

        Scoring rationale:
          - 0 matched phrases → score 10 (minimal residual uncertainty)
          - 1 match           → score 65  (one clear scam phrase is already serious)
          - 2 matches         → score 90
          - 3+ matches        → score 100 (capped)

        This calibration ensures a single strong phrase (e.g. "working abroad")
        raises the profile score enough to be visible in the overall risk.
        """
        if not bio or not bio.strip():
            return {"score": 0, "finding": "No bio text provided.", "evidence": [], "matched": []}

        bio_lower       = bio.lower()
        matched_phrases = [p for p in _SCAM_PHRASES if re.search(p, bio_lower)]
        match_count     = len(matched_phrases)

        if match_count == 0:
            score   = 10
            finding = "Bio text analyzed. No known scam template signatures detected."
        else:
            # Calibrated: 1 match=65, 2=90, 3+=100
            score   = min(40 + match_count * 25, 100)
            # Produce readable phrase labels for findings
            labels  = [p.replace(r"\s*", " ").replace(r"\s+", " ").replace("\\", "") for p in matched_phrases]
            finding = (
                f"Bio matches active romance/financial scam templates. "
                f"Detected {match_count} script phrase cluster(s): "
                + ", ".join(f"'{l}'" for l in labels) + "."
            )

        return {
            "score":    score,
            "finding":  finding,
            "evidence": bio,
            "matched":  matched_phrases,
        }

    # ── Photo analysis ────────────────────────────────────────────────────────

    # ── Photo analysis ────────────────────────────────────────────────────────

    async def analyze_photo(self, file: Optional[UploadFile]) -> Dict[str, Any]:
        """
        Approximation of Error Level Analysis (ELA) using OpenCV Laplacian
        variance as a proxy for compression texture anomalies.
        """
        if not file or not file.filename:
            return {"score": 0, "finding": "No profile photo uploaded."}

        try:
            await file.seek(0)
            raw   = await file.read()
            await file.seek(0)

            arr = np.frombuffer(raw, np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

            if img is None:
                return {"score": 0, "finding": "Could not decode image — unsupported or corrupt format."}

            gray         = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            lap_var      = cv2.Laplacian(gray, cv2.CV_64F).var()
            score        = 20
            signals      = []
            is_deepfake  = False

            # 1. Local ELA Check (Deepfake & Photoshop)
            if lap_var < 80:
                score += 50
                signals.append(
                    f"Abnormally low texture frequency (Laplacian variance {lap_var:.1f}) — "
                    "consistent with AI rendering / deepfake skin-smoothing."
                )
                is_deepfake = True
            elif lap_var > 1500:
                score += 40
                signals.append(
                    f"High edge compression variance ({lap_var:.1f}) — "
                    "pattern consistent with copy-paste composite manipulation."
                )
                is_deepfake = True

            # 2. YOUR LOGIC: Only run Google Web Search if it passed the local fake test!
            if not is_deepfake:
                # Use 'raw' (the image bytes we read earlier)
                web_results = detect_stolen_photo_web(raw)
                
                score += web_results["web_penalty"]
                if web_results["web_signals"]:
                    signals.extend(web_results["web_signals"])

            score   = min(max(score, 10), 100)
            finding = (
                "Image forensic scan complete. "
                + (" ".join(signals) if signals else
                   f"Texture variance ({lap_var:.1f}) within natural photographic range — no manipulation signature detected.")
            )
            return {"score": score, "finding": finding, "laplacian_var": lap_var}

        except Exception as exc:
            logger.error("Photo analysis error: %s", exc)
            # Conservative fallback: flag as moderately uncertain rather than
            # silently giving a free 0 score
            return {
                "score":   35,
                "finding": "Photo forensic scan incomplete due to a processing error. Moderate anomaly threshold applied.",
            }