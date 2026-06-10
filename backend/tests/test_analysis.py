"""
Phase 1 tests — verify all API endpoints return expected shapes.
Run with: pytest tests/ -v
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# ─── Health ───────────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert "modules" in data


# ─── Root ─────────────────────────────────────────────────────────────────────

def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["service"] == "WomenSafe AI API"


# ─── Full analysis ────────────────────────────────────────────────────────────

def test_full_analysis_with_text():
    r = client.post(
        "/api/v1/analyze",
        data={
            "username":  "james_smith1987",
            "bio":       "Engineer working overseas, widowed, looking for genuine connection.",
            "chat_text": "Him: I love you so much. Me: Thank you.",
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert "overall_risk_score" in data
    assert 0 <= data["overall_risk_score"] <= 100
    assert "findings" in data
    assert "recommendations" in data
    assert isinstance(data["findings"], list)


def test_full_analysis_no_input_fails():
    r = client.post("/api/v1/analyze", data={})
    assert r.status_code == 422


# ─── Profile-only ─────────────────────────────────────────────────────────────

def test_profile_analysis_username_only():
    r = client.post("/api/v1/analyze/profile", data={"username": "john.engineer.us"})
    assert r.status_code == 200
    data = r.json()
    assert data["identity_risk_score"] is not None
    assert data["conversation_risk_score"] is None


def test_profile_analysis_no_input_fails():
    r = client.post("/api/v1/analyze/profile", data={})
    assert r.status_code == 422


# ─── Conversation-only ────────────────────────────────────────────────────────

def test_conversation_analysis_with_text():
    chat = (
        "Him: I love you more than anything.\n"
        "Me: That's sweet.\n"
        "Him: I need you to help me — I am stuck at the airport with a customs fee."
    )
    r = client.post("/api/v1/analyze/conversation", data={"chat_text": chat})
    assert r.status_code == 200
    data = r.json()
    assert data["conversation_risk_score"] is not None
    assert data["identity_risk_score"] is None
    assert len(data["findings"]) > 0


def test_conversation_analysis_no_input_fails():
    r = client.post("/api/v1/analyze/conversation", data={})
    assert r.status_code == 422


# ─── Demo endpoints ───────────────────────────────────────────────────────────

def test_demo_clean():
    r = client.get("/api/v1/analyze/demo/clean")
    assert r.status_code == 200
    data = r.json()
    assert data["overall_risk_score"] <= 25
    assert data["risk_level"] == "Low Risk"


def test_demo_high_risk():
    r = client.get("/api/v1/analyze/demo/high-risk")
    assert r.status_code == 200
    data = r.json()
    assert data["overall_risk_score"] > 50


# ─── Response schema validation ───────────────────────────────────────────────

def test_response_shape():
    r = client.post(
        "/api/v1/analyze/profile",
        data={"username": "test_user_123", "bio": "Engineer abroad, widowed with child."},
    )
    assert r.status_code == 200
    data = r.json()

    required_keys = [
        "overall_risk_score", "risk_level", "scam_category",
        "narrative_summary", "findings", "sub_scores",
        "recommendations", "inputs_provided", "confidence_level",
    ]
    for key in required_keys:
        assert key in data, f"Missing key: {key}"

    # Sub-scores
    for ss in data["sub_scores"]:
        assert "label" in ss

    # Recommendations structure
    recs = data["recommendations"]
    assert "immediate" in recs
    assert "short_term" in recs
    assert "support" in recs

    # Finding structure
    for finding in data["findings"]:
        assert "tactic_key"    in finding
        assert "title"         in finding
        assert "severity"      in finding
        assert "severity_score" in finding
        assert "source"        in finding
