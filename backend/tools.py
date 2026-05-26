"""
tools.py — LangChain tools that query PostgreSQL for image generation knowledge
"""
import asyncio
import json
import logging
from typing import Optional
from langchain.tools import tool
from database import get_pool

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────
# Helper: run async queries from sync LangChain context
# ──────────────────────────────────────────────────────────────────
def run_async(coro):
    """Run async coroutine from synchronous context (LangChain tools are sync)."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're already in an async context — use nest_asyncio workaround
            import nest_asyncio
            nest_asyncio.apply()
            return loop.run_until_complete(coro)
        else:
            return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


# ──────────────────────────────────────────────────────────────────
# Tool 1: Search Chapters by User Query
# ──────────────────────────────────────────────────────────────────
@tool
def search_chapters(query: str) -> str:
    """
    Search the image knowledge database for chapters relevant to the user's query.
    Use this first to find what image category and chapter matches the user's request.
    Input: a search query like '3d bus', 'realistic old man', 'anime student', 'dark moody'
    Returns: list of matching chapters with their titles and descriptions.
    """
    async def _search():
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Full-text search + keyword fallback
            rows = await conn.fetch("""
                SELECT 
                    ic.id,
                    ic.title,
                    ic.description,
                    ic.category_tags,
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
                LIMIT 5
            """, query, f"%{query}%")

            if not rows:
                # Fallback: get all chapters as reference
                rows = await conn.fetch("""
                    SELECT id, title, description, category_tags 
                    FROM image_chapters 
                    ORDER BY id
                    LIMIT 10
                """)

            results = []
            for row in rows:
                results.append({
                    "chapter_id": row["id"],
                    "title": row["title"],
                    "description": row["description"],
                    "category_tags": row["category_tags"] or [],
                })
            return results

    try:
        results = run_async(_search())
        if not results:
            return "No matching chapters found. Try a different search term."
        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"search_chapters error: {e}")
        return f"Database search error: {str(e)}"


# ──────────────────────────────────────────────────────────────────
# Tool 2: Get Chapter Details (prompts, hooks, voice)
# ──────────────────────────────────────────────────────────────────
@tool
def get_chapter_details(chapter_id: int) -> str:
    """
    Get the detailed sections of a specific chapter including all prompts,
    best_for tags, best_content types, Sarvam AI voice recommendations, and hooks.
    Use this after identifying the right chapter_id from search_chapters.
    Input: chapter_id (integer, 1-15)
    Returns: full chapter details with all sections, prompts, and voice strategies.
    """
    async def _get_details():
        pool = await get_pool()
        async with pool.acquire() as conn:
            # Get chapter info
            chapter = await conn.fetchrow(
                "SELECT id, title, description FROM image_chapters WHERE id = $1",
                chapter_id
            )
            if not chapter:
                return None, []

            # Get all sections with prompts
            sections = await conn.fetch("""
                SELECT 
                    heading,
                    prompt,
                    best_for,
                    best_content,
                    sarvam_voice,
                    hook_text,
                    facebook_strategy,
                    section_order
                FROM chapter_sections
                WHERE chapter_id = $1
                ORDER BY section_order
            """, chapter_id)

            return chapter, sections

    try:
        chapter, sections = run_async(_get_details())
        if not chapter:
            return f"Chapter {chapter_id} not found."

        result = {
            "chapter_id": chapter["id"],
            "title": chapter["title"],
            "description": chapter["description"],
            "sections": []
        }

        for sec in sections:
            section_data = {
                "heading": sec["heading"],
                "prompt": sec["prompt"],
                "best_for": sec["best_for"] or [],
                "best_content": sec["best_content"] or [],
                "sarvam_voice": sec["sarvam_voice"],
                "hook_text": sec["hook_text"],
                "facebook_strategy": sec["facebook_strategy"],
            }
            # Only include sections with meaningful data
            if any([sec["prompt"], sec["best_for"], sec["hook_text"]]):
                result["sections"].append(section_data)

        return json.dumps(result, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"get_chapter_details error: {e}")
        return f"Error fetching chapter details: {str(e)}"


# ──────────────────────────────────────────────────────────────────
# Tool 3: Get Prompts by Image Style Keyword
# ──────────────────────────────────────────────────────────────────
@tool
def get_prompts_by_style(style_keyword: str) -> str:
    """
    Get AI image prompts filtered by style keyword. 
    Use when you know the image style (e.g., '3d', 'realistic', 'anime', 'cinematic', 'dark', 'pixar').
    Input: style keyword string
    Returns: list of relevant prompts with their context (best_for, best_content).
    """
    async def _get_prompts():
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    ic.title as chapter_title,
                    cs.heading,
                    cs.prompt,
                    cs.best_for,
                    cs.best_content,
                    cs.sarvam_voice,
                    cs.hook_text
                FROM chapter_sections cs
                JOIN image_chapters ic ON cs.chapter_id = ic.id
                WHERE 
                    cs.prompt IS NOT NULL
                    AND (
                        cs.prompt ILIKE $1
                        OR ic.title ILIKE $1
                        OR cs.heading ILIKE $1
                        OR array_to_string(cs.best_for, ' ') ILIKE $1
                    )
                ORDER BY ic.id, cs.section_order
                LIMIT 8
            """, f"%{style_keyword}%")

            results = []
            for row in rows:
                results.append({
                    "chapter": row["chapter_title"],
                    "section": row["heading"],
                    "prompt": row["prompt"],
                    "best_for": row["best_for"] or [],
                    "best_content": row["best_content"] or [],
                    "sarvam_voice": row["sarvam_voice"],
                    "hook": row["hook_text"],
                })
            return results

    try:
        results = run_async(_get_prompts())
        if not results:
            return f"No prompts found for style: {style_keyword}"
        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"get_prompts_by_style error: {e}")
        return f"Error: {str(e)}"


# ──────────────────────────────────────────────────────────────────
# Tool 4: Get All Chapter List
# ──────────────────────────────────────────────────────────────────
@tool
def list_all_chapters(dummy: str = "") -> str:
    """
    Returns a list of ALL 15 image chapters available in the knowledge base.
    Use this when you need to show the user what types of images are covered,
    or when the user's query is very broad/general.
    Input: (no input needed, pass empty string)
    Returns: all 15 chapters with their titles and descriptions.
    """
    async def _list():
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, title, description, category_tags
                FROM image_chapters
                ORDER BY id
            """)
            return [dict(row) for row in rows]

    try:
        results = run_async(_list())
        return json.dumps(results, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"list_all_chapters error: {e}")
        return f"Error: {str(e)}"


# ──────────────────────────────────────────────────────────────────
# Export all tools
# ──────────────────────────────────────────────────────────────────
ALL_TOOLS = [
    search_chapters,
    get_chapter_details,
    get_prompts_by_style,
    list_all_chapters,
]
