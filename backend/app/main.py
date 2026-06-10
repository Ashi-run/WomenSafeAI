"""
WomenSafe AI — FastAPI Application

Phase 1: Fully functional API with mock AI responses.
         All endpoints accept real inputs and return typed responses.
         Replace mock_* service calls with real AI modules in Phase 2.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes.analysis import router as analysis_router, analyzer as conversation_analyzer, image_analyzer


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────
    print("─" * 50)
    print(f"  WomenSafe AI Backend — {settings.app_env.upper()}")
    print(f"  API prefix  : {settings.api_prefix}")
    print(f"  Phase 3     : Multimodal AI Pipeline")
    print("─" * 50)

    # Conversation NLP model
    try:
        conversation_analyzer.load()
        print("  ✓ ConversationAnalyzer (DistilBERT ONNX) loaded")
    except Exception as exc:
        print(f"  ✗ ConversationAnalyzer failed: {exc}")
        print("    Conversation endpoints will return 503.")

    # GAN / liveness image model
    try:
        image_analyzer.load()
        print("  ✓ ProfileImageAnalyzer (liveness ONNX) loaded")
    except Exception as exc:
        print(f"  ✗ ProfileImageAnalyzer failed: {exc}")
        print("    GAN detection will be skipped (photo ELA still runs).")

    print("─" * 50)

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────
    print("WomenSafe AI Backend shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "WomenSafe AI API",
    description = (
        "Backend API for WomenSafe AI — a multi-modal fraud detection platform. "
        "Analyzes profile photos, usernames, bios, and conversation text to identify "
        "online romance scams, catfishing, and manipulation tactics."
    ),
    version     = "1.0.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
    lifespan    = lifespan,
)


# ─── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins     = settings.cors_origins,
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(analysis_router)


# ─── Root ─────────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return JSONResponse({
        "service"    : "WomenSafe AI API",
        "version"    : "1.0.0",
        "phase"      : "1 — Mock responses",
        "docs"       : "/docs",
        "health"     : f"{settings.api_prefix}/health",
    })


# ─── Global exception handler ────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code = 500,
        content     = {
            "detail"  : "An unexpected error occurred. Please try again.",
            "type"    : type(exc).__name__,
        },
    )
