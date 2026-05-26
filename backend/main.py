"""
main.py — FastAPI application entry point
Karma Images Chatbot Backend
"""
import uuid
import logging
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import create_tables, get_pool, close_pool
from models import ChatRequest, ChatResponse, HealthResponse, SarvamVoiceInfo
from agent import chat, clear_session

# ──────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────
# Lifespan (startup/shutdown events)
# ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create DB tables. Shutdown: close DB pool."""
    logger.info("🚀 Starting Karma Images Chatbot Backend...")
    try:
        await create_tables()
        logger.info("✅ Database ready")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        logger.error("Make sure PostgreSQL is running and DATABASE_URL is correct in .env")
    
    yield  # App runs here
    
    logger.info("🛑 Shutting down...")
    await close_pool()


# ──────────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Karma Images Chatbot API",
    description="AI-powered chatbot for Facebook image generation guidance using LangChain + Groq",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Karma Images Chatbot API", "docs": "/docs"}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    db_status = "ok"
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
    except Exception as e:
        db_status = f"error: {str(e)}"

    return HealthResponse(
        status="ok",
        db=db_status,
        model=settings.GROQ_MODEL,
        timestamp=datetime.utcnow(),
    )


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint.
    Accepts user message + optional session_id.
    Returns AI response with structured image generation guidance.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Generate session ID if not provided
    session_id = request.session_id or str(uuid.uuid4())

    # Get response from LangChain agent
    reply = await chat(
        message=request.message.strip(),
        session_id=session_id,
    )

    # Parse structured data from reply for frontend cards
    category = _extract_field(reply, "📁 IMAGE CATEGORY", "🎨")
    prompt = _extract_field(reply, "🎨 RECOMMENDED PROMPT", "🎣")
    hook = _extract_field(reply, "🎣 FACEBOOK HOOK", "🗣️")
    voice_raw = _extract_field(reply, "🗣️ SARVAM AI VOICE", "📱")
    facebook_strategy = _extract_field(reply, "🚀 FACEBOOK STRATEGY", "📊")

    # Parse Sarvam voice details
    sarvam_voice = None
    if voice_raw:
        sarvam_voice = SarvamVoiceInfo(
            voice_type=_extract_arrow(voice_raw, "Voice Type"),
            tone=_extract_arrow(voice_raw, "Tone"),
            pace=_extract_arrow(voice_raw, "Pace"),
        )

    return ChatResponse(
        reply=reply,
        session_id=session_id,
        category=category,
        prompt=prompt,
        hook=hook,
        sarvam_voice=sarvam_voice,
        facebook_strategy=facebook_strategy,
    )


@app.delete("/chat/{session_id}")
async def clear_chat(session_id: str):
    """Clear conversation memory for a session."""
    clear_session(session_id)
    return {"message": f"Session {session_id} cleared"}


@app.get("/chapters")
async def get_chapters():
    """Get all 15 chapters for the frontend sidebar."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, title, description, category_tags FROM image_chapters ORDER BY id"
            )
            return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────────────────────────
# Helpers: Parse structured response from agent
# ──────────────────────────────────────────────────────────────────
def _extract_field(text: str, start_marker: str, end_marker: str) -> str | None:
    """Extract text between two emoji markers in the response."""
    try:
        start_idx = text.find(start_marker)
        if start_idx == -1:
            return None
        start_idx += len(start_marker)
        end_idx = text.find(end_marker, start_idx)
        if end_idx == -1:
            extracted = text[start_idx:].strip()
        else:
            extracted = text[start_idx:end_idx].strip()
        # Clean up lines
        lines = [line.strip() for line in extracted.split("\n") if line.strip()]
        return "\n".join(lines) if lines else None
    except Exception:
        return None


def _extract_arrow(text: str, label: str) -> str | None:
    """Extract value after '→ Label:' pattern."""
    try:
        marker = f"→ {label}:"
        idx = text.find(marker)
        if idx == -1:
            return None
        start = idx + len(marker)
        end = text.find("\n", start)
        value = text[start:end].strip() if end != -1 else text[start:].strip()
        return value or None
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True,
        log_level="info",
    )
