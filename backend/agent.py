"""
agent.py — Simple RAG-based chat: query DB in Python → pass context to Groq LLM.
Avoids Groq's tool-calling 'failed_generation' error entirely.
"""
import logging
import json
import asyncio
from typing import Dict, List
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from config import settings
from database import get_pool

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────
# In-memory session chat history (list of LangChain messages)
# ──────────────────────────────────────────────────────────────────
_session_histories: Dict[str, List] = {}


def get_or_create_history(session_id: str) -> List:
    if session_id not in _session_histories:
        _session_histories[session_id] = []
        logger.info(f"New session created: {session_id}")
    return _session_histories[session_id]


def clear_session(session_id: str):
    if session_id in _session_histories:
        del _session_histories[session_id]


# ──────────────────────────────────────────────────────────────────
# DB Query: Semantic search for relevant chapters/sections
# ──────────────────────────────────────────────────────────────────
async def retrieve_context(user_message: str) -> str:
    """
    Query PostgreSQL for chapters and sections most relevant to the user message.
    Returns a compact JSON string to inject as context into the LLM prompt.
    """
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Step 1: Full-text search on chapter titles + descriptions
            chapter_rows = await conn.fetch("""
                SELECT 
                    ic.id,
                    ic.title,
                    ic.description,
                    ts_rank(
                        to_tsvector('english', coalesce(ic.title,'') || ' ' || coalesce(ic.description,'')),
                        plainto_tsquery('english', $1)
                    ) as rank
                FROM image_chapters ic
                WHERE 
                    to_tsvector('english', coalesce(ic.title,'') || ' ' || coalesce(ic.description,''))
                    @@ plainto_tsquery('english', $1)
                    OR ic.title ILIKE $2
                ORDER BY rank DESC
                LIMIT 3
            """, user_message, f"%{user_message}%")

            # Step 2: If no FTS match, grab top 3 chapters most likely relevant
            if not chapter_rows:
                chapter_rows = await conn.fetch("""
                    SELECT id, title, description
                    FROM image_chapters
                    WHERE title ILIKE ANY(ARRAY[
                        '%3d%', '%pixar%', '%anime%', '%cinematic%', '%realistic%',
                        '%dark%', '%spiritual%', '%thumbnail%', '%sarvam%'
                    ])
                    ORDER BY id
                    LIMIT 3
                """)

            # Step 3: Fallback — return first 2 chapters
            if not chapter_rows:
                chapter_rows = await conn.fetch(
                    "SELECT id, title, description FROM image_chapters ORDER BY id LIMIT 2"
                )

            chapter_ids = [r["id"] for r in chapter_rows]

            # Step 4: Get sections for matched chapters (with prompts, hooks, voice)
            if chapter_ids:
                placeholders = ", ".join(f"${i+1}" for i in range(len(chapter_ids)))
                sections = await conn.fetch(f"""
                    SELECT 
                        ic.title as chapter_title,
                        cs.heading,
                        cs.prompt,
                        cs.best_for,
                        cs.best_content,
                        cs.sarvam_voice,
                        cs.hook_text,
                        cs.facebook_strategy
                    FROM chapter_sections cs
                    JOIN image_chapters ic ON cs.chapter_id = ic.id
                    WHERE cs.chapter_id IN ({placeholders})
                      AND (cs.prompt IS NOT NULL OR cs.hook_text IS NOT NULL)
                    ORDER BY ic.id, cs.section_order
                    LIMIT 12
                """, *chapter_ids)
            else:
                sections = []

            # Step 5: Also do a keyword search across section prompts
            keyword_sections = await conn.fetch("""
                SELECT 
                    ic.title as chapter_title,
                    cs.heading,
                    cs.prompt,
                    cs.best_for,
                    cs.sarvam_voice,
                    cs.hook_text,
                    cs.facebook_strategy
                FROM chapter_sections cs
                JOIN image_chapters ic ON cs.chapter_id = ic.id
                WHERE 
                    cs.prompt ILIKE $1
                    OR cs.heading ILIKE $1
                ORDER BY ic.id
                LIMIT 5
            """, f"%{user_message}%")

            # Combine and deduplicate
            seen_headings = set()
            all_sections = []
            for row in list(sections) + list(keyword_sections):
                key = (row["chapter_title"], row["heading"])
                if key not in seen_headings:
                    seen_headings.add(key)
                    all_sections.append({
                        "chapter": row["chapter_title"],
                        "section": row["heading"],
                        "prompt": row["prompt"],
                        "best_for": list(row["best_for"]) if row["best_for"] else [],
                        "sarvam_voice": row["sarvam_voice"],
                        "hook": row["hook_text"],
                        "strategy": row["facebook_strategy"],
                    })

            context = {
                "matched_chapters": [
                    {"id": r["id"], "title": r["title"], "description": r["description"]}
                    for r in chapter_rows
                ],
                "sections": all_sections[:15],  # cap to avoid token overflow
            }
            return json.dumps(context, indent=2, ensure_ascii=False)

    except Exception as e:
        logger.error(f"retrieve_context error: {e}", exc_info=True)
        return "{}"


# ──────────────────────────────────────────────────────────────────
# System prompt
# ──────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert Facebook content creator AI assistant for Indian audiences.

You will be given RETRIEVED DATABASE CONTEXT containing image chapters, prompts, voice strategies, and hooks.

Your job:
1. Read the context carefully
2. Pick the BEST matching image style/category for the user's request
3. Return a COMPLETE, STRUCTURED response using this exact format:

═══════════════════════════════════════════
📁 IMAGE CATEGORY
[Category name and brief description]

🎨 RECOMMENDED PROMPT
[Exact copy-ready AI image prompt the user can paste directly into MidJourney / Stable Diffusion / Kling]

🎣 FACEBOOK HOOK
[Attention-grabbing first line for the reel/post — makes viewer stop scrolling]

🗣️ SARVAM AI VOICE
→ Voice: [Arjun / Diya / Meera / Ravi + male/female]
→ Tone: [emotional / energetic / calm / dramatic]
→ Pace: [slow / medium / fast]

📱 BEST FOR
• [Use case 1]
• [Use case 2]
• [Use case 3]

🚀 FACEBOOK STRATEGY
[Posting tips, timing, animation style, music suggestion for Indian Facebook]

📊 VIRAL POTENTIAL: [⭐ to ⭐⭐⭐⭐⭐]
[Why this works for Indian Facebook audience aged 25-50]
═══════════════════════════════════════════

RULES:
- ALWAYS use data from the retrieved context — never make up prompts or hooks
- If context has multiple matching styles, pick the BEST one and briefly mention others
- If the user asks about a vehicle/object (bus, car, temple), map to the closest style (3D Pixar, Cinematic, Realistic)
- Make the hook punchy and emotional — these are for Indian audiences
- Keep Sarvam AI voice specific: name + tone + pace
- Be encouraging and conversational
"""


# ──────────────────────────────────────────────────────────────────
# Main Chat Function
# ──────────────────────────────────────────────────────────────────
async def chat(message: str, session_id: str) -> str:
    """
    RAG-based chat:
    1. Retrieve relevant DB context for the user message
    2. Build messages list with system prompt + context + history + user message
    3. Call Groq LLM directly (no tool-calling)
    4. Return the AI response
    """
    try:
        history = get_or_create_history(session_id)
        logger.info(f"[{session_id}] User: {message[:100]}")

        # Step 1: Retrieve context from DB
        context_json = await retrieve_context(message)
        logger.info(f"[{session_id}] Retrieved context ({len(context_json)} chars)")

        # Step 2: Build LLM
        llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=settings.GROQ_API_KEY,
            temperature=0.7,
            max_tokens=2048,
        )

        # Step 3: Build messages
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
        ]

        # Inject recent history (last MAX_MEMORY_MESSAGES turns)
        max_hist = settings.MAX_MEMORY_MESSAGES * 2  # pairs
        for msg in history[-max_hist:]:
            messages.append(msg)

        # Inject retrieved context as a system-level note before the user message
        context_note = f"""
--- RETRIEVED DATABASE CONTEXT ---
{context_json}
--- END CONTEXT ---

Use the above context to answer the user's request below.
"""
        messages.append(HumanMessage(content=context_note + "\n\nUser request: " + message))

        # Step 4: Call LLM (no tool-calling, just direct generation)
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: llm.invoke(messages)
        )

        ai_text = response.content

        # Step 5: Save to history
        history.append(HumanMessage(content=message))
        history.append(AIMessage(content=ai_text))

        logger.info(f"[{session_id}] Responded successfully ({len(ai_text)} chars)")
        return ai_text

    except Exception as e:
        logger.error(f"Chat error for session {session_id}: {e}", exc_info=True)
        return (
            "❌ I encountered an error while processing your request.\n"
            f"Error: {str(e)}\n\n"
            "Please make sure the backend server has a valid GROQ_API_KEY set in .env"
        )
