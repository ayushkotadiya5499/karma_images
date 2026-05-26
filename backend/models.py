"""
models.py — Pydantic request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ──────────────────────────────────────────────────────────────────
# API Request / Response Models
# ──────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID for memory continuity")


class SarvamVoiceInfo(BaseModel):
    voice_type: Optional[str] = None
    tone: Optional[str] = None
    pace: Optional[str] = None
    best_for: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    session_id: str
    category: Optional[str] = None
    chapter_id: Optional[int] = None
    prompt: Optional[str] = None
    hook: Optional[str] = None
    sarvam_voice: Optional[SarvamVoiceInfo] = None
    best_for: Optional[List[str]] = None
    facebook_strategy: Optional[str] = None


# ──────────────────────────────────────────────────────────────────
# DB Row Models (for type safety in tools)
# ──────────────────────────────────────────────────────────────────

class ChapterSummary(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category_tags: Optional[List[str]] = None


class SectionResult(BaseModel):
    chapter_id: int
    chapter_title: str
    heading: str
    prompt: Optional[str] = None
    best_for: Optional[List[str]] = None
    best_content: Optional[List[str]] = None
    sarvam_voice: Optional[str] = None
    hook_text: Optional[str] = None
    facebook_strategy: Optional[str] = None
    markdown: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    db: str
    model: str
    timestamp: datetime
