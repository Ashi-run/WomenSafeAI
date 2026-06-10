# WomenSafe AI

A web-based platform that helps users identify potentially fraudulent online identities by analyzing profile information and conversation patterns.

## Project Structure

```
womensafe-ai/
├── frontend/          # React + Vite + Tailwind CSS
└── backend/           # FastAPI Python backend
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Runs on http://localhost:8000
# API Docs at http://localhost:8000/docs
```

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, shadcn/ui |
| Backend    | FastAPI, Uvicorn, Pydantic        |
| State      | React Context + useState          |
| Routing    | React Router v6                   |
| HTTP       | Axios                             |
| Charts     | Recharts                          |

## Phase 1 Scope (Current)
- ✅ Landing Page
- ✅ Analysis Page (Profile + Conversation inputs)
- ✅ Results Page with mock data
- ✅ Safety Center
- ✅ FAQ Page
- ✅ FastAPI backend with all endpoints (mock data)
- ✅ Full routing
- ✅ Mobile responsive

## Phase 2 (Next)
- OCR pipeline for screenshots
- Username + bio NLP analysis
- Profile photo analysis
- Conversation tactic classifiers
- Real risk scoring engine
