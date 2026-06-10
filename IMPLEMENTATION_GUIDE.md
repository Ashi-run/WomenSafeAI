# WomenSafe AI — Phase 1 Complete Implementation Guide

## ✅ Build Status
- **Backend tests:** 11/11 passing
- **Frontend build:** Clean (0 errors)
- **All API endpoints:** Verified working

---

## Project Structure

```
womensafe-ai/
│
├── README.md
│
├── frontend/                          ← React + Vite + Tailwind
│   ├── index.html                     ← Entry HTML (Google Fonts loaded here)
│   ├── vite.config.js                 ← Vite config + /api proxy to backend
│   ├── tailwind.config.js             ← Custom design tokens (colors, fonts, animations)
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                   ← React entry point
│       ├── App.jsx                    ← Router + AnalysisProvider wrapper
│       ├── context/
│       │   └── AnalysisContext.jsx    ← Shared state between Analyze → Results
│       ├── services/
│       │   └── api.js                 ← All axios API calls in one place
│       ├── utils/
│       │   └── helpers.js             ← cn(), getRiskLevel(), formatScore(), etc.
│       ├── styles/
│       │   └── globals.css            ← Tailwind base + custom component classes
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Layout.jsx         ← Navbar + Footer wrapper
│       │   │   ├── Navbar.jsx         ← Responsive nav with mobile drawer
│       │   │   ├── Footer.jsx         ← Full footer with all links
│       │   │   └── ScrollToTop.jsx    ← Auto-scroll on route change
│       │   ├── analysis/
│       │   │   └── FileDropzone.jsx   ← Drag-and-drop file upload component
│       │   └── results/
│       │       ├── ScoreRing.jsx      ← Animated SVG score ring
│       │       └── RiskBar.jsx        ← Animated risk score progress bar
│       └── pages/
│           ├── LandingPage.jsx        ← Full landing page (7 sections)
│           ├── AnalyzePage.jsx        ← Form with 3 tabs + file upload
│           ├── ResultsPage.jsx        ← Full results with findings accordion
│           ├── SafetyCenterPage.jsx   ← Topic index page
│           ├── SafetyTopicPage.jsx    ← Individual topic detail pages
│           ├── AboutPage.jsx
│           ├── FaqPage.jsx
│           ├── ContactPage.jsx
│           └── NotFoundPage.jsx
│
└── backend/                           ← FastAPI + Uvicorn
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── main.py                    ← FastAPI app, CORS, middleware, routers
        ├── core/
        │   └── config.py              ← Pydantic settings (reads from .env)
        ├── models/
        │   └── schemas.py             ← All Pydantic request/response models
        ├── services/
        │   └── mock_analysis.py       ← Mock data factory (replace in Phase 2)
        └── api/
            └── routes/
                └── analysis.py        ← All API route handlers
```

---

## Running the Project

### Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Start the server
uvicorn app.main:app --reload

# Server runs at: http://localhost:8000
# Auto-generated API docs: http://localhost:8000/docs
# ReDoc docs: http://localhost:8000/redoc
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# App runs at: http://localhost:5173
```

### Running Backend Tests

```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
pytest tests/ -v
```

Expected output: **11 passed**

---

## API Endpoints Reference

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Health check + module status |
| `POST` | `/analyze` | Full analysis (profile + conversation) |
| `POST` | `/analyze/profile` | Profile-only analysis |
| `POST` | `/analyze/conversation` | Conversation-only analysis |
| `GET`  | `/analyze/demo/clean` | Demo: returns low-risk result |
| `GET`  | `/analyze/demo/high-risk` | Demo: returns high-risk result |

### Request Format

All POST endpoints accept `multipart/form-data`:

```
POST /api/v1/analyze
Content-Type: multipart/form-data

profile_photo:    [file, optional]
username:         string, optional
bio:              string, optional
chat_text:        string, optional
chat_screenshots: [files, optional, max 10]
```

### Response Format

```json
{
  "identity_risk_score":     74,
  "conversation_risk_score": 88,
  "overall_risk_score":      83,
  "risk_level":              "High Risk",
  "scam_category":           "Romance Scam",
  "narrative_summary":       "The profile photo has been found on...",
  "findings": [
    {
      "tactic_key":     "love_bombing",
      "title":          "Love Bombing Detected",
      "summary":        "One-sentence description",
      "detail":         "Full explanation",
      "evidence":       ["\"Quoted text from input\""],
      "explanation":    "Why this tactic is used",
      "severity":       "high",
      "severity_score": 91,
      "source":         "conversation"
    }
  ],
  "sub_scores": [
    { "label": "Photo Authenticity", "score": 82 }
  ],
  "recommendations": {
    "immediate":  [{ "text": "...", "link": null }],
    "short_term": [{ "text": "...", "link": "https://..." }],
    "support":    [{ "text": "...", "link": "/safety-center/..." }]
  },
  "inputs_provided":  ["profile_photo", "username", "bio", "conversation"],
  "analysis_version": "1.0.0-mock",
  "confidence_level": 88
}
```

---

## Pages and Routes

| URL | Page | Description |
|-----|------|-------------|
| `/` | Landing Page | Hero, How It Works, detection grid, comparison table, scenarios, CTA |
| `/analyze` | Analysis Page | Tabbed form (Full / Profile / Conversation), file upload, submit |
| `/results` | Results Page | Score rings, findings accordion, recommendations, export |
| `/safety-center` | Safety Center Index | Topic cards linking to detail pages |
| `/safety-center/romance-scams` | Safety Topic | Romance scam education + resources |
| `/safety-center/catfishing` | Safety Topic | Catfishing education |
| `/safety-center/sextortion` | Safety Topic | Sextortion education |
| `/safety-center/financial-scams` | Safety Topic | Financial scam education |
| `/safety-center/what-to-do` | Safety Topic | Immediate action guide |
| `/about` | About | Mission, how it works, privacy commitment |
| `/faq` | FAQ | 10 expandable Q&A items |
| `/contact` | Contact | Contact form + emergency reporting links |

---

## Design System

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `teal-500` | `#1A6B5A` | Primary brand, CTAs, trust elements |
| `coral-500` | `#E8614A` | High risk, alerts, warnings |
| `lavender-500` | `#7B6EA8` | Soft accents, secondary elements |
| `sage-500` | `#4CAF79` | Low risk, success, safe indicators |
| `amber-500` | `#F5A623` | Medium risk, moderate warnings |
| `[#2C2C2C]` | Charcoal | Primary text |
| `[#6B7280]` | Slate | Secondary text, descriptions |
| `[#F8F7F4]` | Off-white | Page background |

### Typography

- **Headings (h1–h3):** DM Serif Display — editorial, authoritative
- **Body + UI:** DM Sans — clean, modern, readable at small sizes
- **Code:** DM Mono — for badge counters and technical labels

### Component Classes (globals.css)

```css
.btn-primary     — Teal filled button
.btn-secondary   — White outlined button
.btn-ghost       — Text-only button
.card            — White card with border and shadow
.card-hover      — Card with hover lift animation
.input           — Text input field
.textarea        — Multi-line textarea
.upload-zone     — Drag-and-drop area
.badge           — Status pill
.badge-low/medium/high/critical — Risk-colored badges
```

---

## Phase 2 Integration Guide

When you are ready to replace mock data with real AI:

### Step 1 — OCR Module (Week 2, Days 1–2)
Replace in `app/api/routes/analysis.py`:
```python
# Current (Phase 1):
await _simulate_processing(1.5)
return mock_conversation_analysis(has_chat=True)

# Phase 2:
from app.services.ocr import extract_text_from_screenshots
extracted_text = await extract_text_from_screenshots(chat_screenshots)
# Then pass to NLP module
```

Create `app/services/ocr.py` with pytesseract + OpenCV pipeline.

### Step 2 — Profile Analysis Module (Week 2, Days 3–7)
Create `app/services/profile_analyzer.py`:
```python
async def analyze_profile(photo_bytes, username, bio) -> ProfileAnalysisResult:
    photo_score    = await check_image_authenticity(photo_bytes)
    username_score = analyze_username_patterns(username)
    bio_score      = analyze_bio_text(bio)
    return ProfileAnalysisResult(...)
```

### Step 3 — Conversation NLP Module (Week 3, Days 1–3)
Create `app/services/conversation_analyzer.py`:
```python
async def analyze_conversation(text: str) -> ConversationAnalysisResult:
    tactics = await run_tactic_classifiers(text)
    return ConversationAnalysisResult(tactics=tactics, ...)
```

Load fine-tuned DistilBERT models from Hugging Face Hub:
```python
from transformers import pipeline
classifier = pipeline("text-classification", model="your-org/womensafe-tactic-classifier")
```

### Step 4 — Risk Scoring Engine (Week 3, Days 4–5)
Create `app/services/risk_scorer.py`:
```python
def compute_scores(profile_result, conversation_result) -> RiskScores:
    identity_score     = (photo_risk * 0.50 + username_risk * 0.20 + bio_risk * 0.30)
    conversation_score = sum(tactic.score * weight[tactic.key] for tactic in tactics)
    overall_score      = identity_score * 0.40 + conversation_score * 0.60
    return RiskScores(identity=identity_score, conversation=conversation_score, overall=overall_score)
```

### Environment Variables to Add (Phase 2)

```env
# .env
GOOGLE_VISION_API_KEY=your_key
HUGGINGFACE_API_TOKEN=your_token
TESSERACT_PATH=/usr/bin/tesseract    # Linux
# TESSERACT_PATH=C:/Program Files/Tesseract-OCR/tesseract.exe   # Windows
```

---

## Deployment (Vercel + Railway)

### Frontend → Vercel

```bash
# From frontend/ directory
npm run build

# Push to GitHub, then:
# 1. Go to vercel.com
# 2. Import your GitHub repo
# 3. Set Root Directory: frontend
# 4. Set VITE_API_URL environment variable to your Railway backend URL
# 5. Deploy
```

### Backend → Railway

```bash
# 1. Create account at railway.app
# 2. New Project → Deploy from GitHub
# 3. Set Root Directory: backend
# 4. Add Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
# 5. Add Environment Variables from .env.example
# 6. Set CORS_ORIGINS to your Vercel frontend URL
```

### Procfile (optional, for Railway/Heroku)

```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Known Limitations (Phase 1)

1. **No real AI** — All results are mock data. Scores are hardcoded.
2. **No file storage** — Uploaded files are read and discarded (this is correct by design).
3. **No rate limiting** — Add in Phase 2 before any public deployment.
4. **No authentication** — Intentional; stateless design is the privacy model.
5. **Results not persistent** — Refreshing the results page redirects to /analyze (by design).

---

## Phase 2 Roadmap

| Week | Focus | Key Deliverable |
|------|-------|-----------------|
| Week 2 | OCR + Profile Analysis | Real photo, username, bio scores |
| Week 3 | Conversation NLP + Scoring | Real tactic classification |
| Week 4 | Polish + Testing | Production-ready, 15 test scenarios |
