"""
migrate.py — One-time data migration script
Reads the existing chapters.js data and loads it into PostgreSQL.

Usage:
    cd backend
    python migrate.py

This will:
1. Parse src/data/chapters.js (converted to JSON format)
2. Extract all 15 chapters with their sections
3. Pull out prompts, bestFor, bestContent, sarvam voice, hooks
4. Insert everything into PostgreSQL

Run ONCE to seed the database.
"""
import asyncio
import asyncpg
import json
import re
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the backend directory
load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://karma:karma123@localhost:5432/karma_images")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────
# 1. Load chapters.js — it's a JS module export, convert to JSON
# ──────────────────────────────────────────────────────────────────

def load_chapters_js() -> list:
    """
    Load and parse the chapters.js file.
    The file exports a JS array — we extract the JSON part.
    """
    # Look for chapters.js relative to project root
    script_dir = Path(__file__).parent
    chapters_path = script_dir.parent / "src" / "data" / "chapters.js"
    
    if not chapters_path.exists():
        logger.error(f"chapters.js not found at: {chapters_path}")
        sys.exit(1)
    
    logger.info(f"Reading: {chapters_path}")
    content = chapters_path.read_text(encoding="utf-8")
    
    # Remove the JS export wrapper: "export const chapters = "
    content = content.strip()
    if content.startswith("export const chapters ="):
        content = content[len("export const chapters ="):].strip()
    
    # Remove trailing semicolon
    if content.endswith(";"):
        content = content[:-1]
    
    # The content is now a JSON array (chapters.js uses JSON-compatible syntax)
    # Fix JS-specific patterns that aren't valid JSON:
    # 1. Replace \u0026 → & (already escaped in the file, fine for JSON)
    # 2. The file uses standard JSON so should parse directly
    
    try:
        chapters = json.loads(content)
        logger.info(f"✅ Loaded {len(chapters)} chapters from chapters.js")
        return chapters
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        # Try to find the error position and show context
        lines = content.split("\n")
        logger.error(f"Near line {e.lineno}: {lines[e.lineno-1] if e.lineno <= len(lines) else 'EOF'}")
        sys.exit(1)


# ──────────────────────────────────────────────────────────────────
# 2. Extract Sarvam Voice info from markdown text
# ──────────────────────────────────────────────────────────────────

# Map chapter titles → voice strategy
SARVAM_VOICE_MAP = {
    1: "Slow emotional male voice | Tone: Sad/reflective | For: realistic emotional content",
    2: "Happy playful voice | Tone: Warm/friendly | For: Pixar 3D family content",
    3: "Energetic youth voice | Tone: Cool/dynamic | For: anime action/drama content",
    4: "Deep dramatic male | Tone: Intense/dark | For: cinematic movie-style content",
    5: "Calm deep spiritual | Tone: Serene/wise | For: spiritual Indian content",
    6: "Confident female | Tone: Strong/inspiring | For: motivational content",
    7: "Energetic announcer | Tone: Bold/exciting | For: advertisement style",
    8: "Soft emotional female | Tone: Gentle/warm | For: dark moody sad stories",
    9: "Storyteller male | Tone: Classic/nostalgic | For: semi-realistic content",
    10: "Dynamic narrator | Tone: Engaging/clear | For: thumbnail/hook content",
    11: "Calm wise narrator | Tone: Confident/clear | For: prompt engineering",
    12: "Cinematic voice | Tone: Epic/dramatic | For: video transition content",
    13: "Soft background | Tone: Subtle/emotional | For: character consistency",
    14: "Deep wise male | Tone: Thoughtful/calm | For: Facebook strategy content",
    15: "Professional clear | Tone: Informative | For: technical/guide content",
}

# Map chapter titles → category tags
CATEGORY_TAGS_MAP = {
    1: ["realistic", "cinematic", "emotional", "portrait", "dslr"],
    2: ["3d", "pixar", "cartoon", "family", "kids", "animation"],
    3: ["anime", "manga", "youth", "action", "school"],
    4: ["cinematic", "movie", "dramatic", "epic", "story"],
    5: ["spiritual", "indian", "devotional", "divine", "temple"],
    6: ["motivational", "success", "hustle", "business", "inspiration"],
    7: ["advertisement", "product", "hyperrealistic", "commercial"],
    8: ["dark", "moody", "sad", "emotional", "night", "aesthetic"],
    9: ["semi-realistic", "soft", "gentle", "warm"],
    10: ["thumbnail", "hook", "facebook", "viral", "reel"],
    11: ["prompt", "engineering", "technique", "workflow"],
    12: ["video", "transition", "animation", "reel", "sequence"],
    13: ["character", "consistency", "style", "brand"],
    14: ["strategy", "facebook", "algorithm", "growth"],
    15: ["guide", "tutorial", "beginner", "workflow"],
}


def extract_hook_from_section(section: dict, chapter_id: int) -> str | None:
    """Extract hook examples from markdown content."""
    markdown = section.get("markdown", "") or ""
    
    # Look for blockquote patterns (> "text")
    hooks = re.findall(r'[">]\s*["""](.+?)["""]', markdown)
    if hooks:
        return hooks[0]
    
    # Look for hook-labeled sections
    if "hook" in section.get("heading", "").lower():
        content = section.get("content", "") or ""
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        for line in lines[:3]:
            if len(line) > 20 and not line.startswith("#"):
                return line
    
    return None


def extract_facebook_strategy(section: dict) -> str | None:
    """Extract Facebook strategy text from sections."""
    heading = section.get("heading", "").lower()
    markdown = section.get("markdown", "") or ""
    
    strategy_keywords = ["facebook", "viral", "strategy", "algorithm", "post", "reel"]
    if any(kw in heading for kw in strategy_keywords):
        content = section.get("content", "") or ""
        lines = [l.strip() for l in content.split("\n") if l.strip()]
        return " | ".join(lines[:4]) if lines else None
    
    return None


# ──────────────────────────────────────────────────────────────────
# 3. Database operations
# ──────────────────────────────────────────────────────────────────

CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS image_chapters (
    id              INTEGER PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    category_tags   TEXT[],
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapter_sections (
    id                  SERIAL PRIMARY KEY,
    chapter_id          INTEGER REFERENCES image_chapters(id) ON DELETE CASCADE,
    heading             TEXT NOT NULL,
    markdown            TEXT,
    prompt              TEXT,
    best_for            TEXT[],
    best_content        TEXT[],
    sarvam_voice        TEXT,
    hook_text           TEXT,
    facebook_strategy   TEXT,
    section_order       INTEGER,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_chapter ON chapter_sections(chapter_id);
CREATE INDEX IF NOT EXISTS idx_sections_prompt ON chapter_sections(prompt) WHERE prompt IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chapters_fts ON image_chapters 
    USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX IF NOT EXISTS idx_sections_fts ON chapter_sections 
    USING gin(to_tsvector('english', 
        coalesce(heading,'') || ' ' || 
        coalesce(prompt,'')
    ));
"""


async def migrate():
    """Main migration function."""
    logger.info(f"Connecting to: {DATABASE_URL}")
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        # Create tables
        logger.info("Creating tables...")
        await conn.execute(CREATE_TABLES_SQL)
        logger.info("✅ Tables created")

        # Load chapters data
        chapters = load_chapters_js()

        # Clear existing data (for re-runs)
        await conn.execute("DELETE FROM chapter_sections")
        await conn.execute("DELETE FROM image_chapters")
        logger.info("✅ Cleared existing data")

        total_sections = 0
        total_prompts = 0

        for chapter in chapters:
            chapter_id = chapter["id"]
            title = chapter.get("title", f"Chapter {chapter_id}")
            description = chapter.get("description", "")
            category_tags = CATEGORY_TAGS_MAP.get(chapter_id, [])

            # Insert chapter
            await conn.execute("""
                INSERT INTO image_chapters (id, title, description, category_tags)
                VALUES ($1, $2, $3, $4)
            """, chapter_id, title, description, category_tags)

            logger.info(f"  ✅ Chapter {chapter_id}: {title}")

            # Process sections
            sections = chapter.get("sections", [])
            for order, section in enumerate(sections):
                heading = section.get("heading", "")
                markdown = section.get("markdown", "")
                prompt = section.get("prompt") or None
                best_for = section.get("bestFor") or []
                best_content = section.get("bestContent") or []
                
                # If no prompt field, try to extract from markdown ```text blocks
                if not prompt and markdown:
                    # Match ```text ... ``` blocks
                    code_blocks = re.findall(r'```(?:text)?\s*(?:id="[^"]*")?\s*\n(.*?)```', markdown, re.DOTALL)
                    for block in code_blocks:
                        block = block.strip()
                        # A valid prompt is > 30 chars and doesn't start with [ (template)
                        if len(block) > 30 and not block.startswith("["):
                            # Avoid formula-style entries (contains [Subject], [Age] etc.)
                            if "[" not in block[:20]:
                                prompt = block
                                break
                
                # Get voice from our map
                sarvam_voice = SARVAM_VOICE_MAP.get(chapter_id)
                
                # Extract hook
                hook_text = extract_hook_from_section(section, chapter_id)
                
                # Extract facebook strategy
                facebook_strategy = extract_facebook_strategy(section)

                # Skip empty/trivial sections
                if not heading:
                    continue

                await conn.execute("""
                    INSERT INTO chapter_sections 
                        (chapter_id, heading, markdown, prompt, best_for, best_content,
                         sarvam_voice, hook_text, facebook_strategy, section_order)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """,
                    chapter_id,
                    heading,
                    markdown,
                    prompt,
                    best_for if best_for else [],
                    best_content if best_content else [],
                    sarvam_voice,
                    hook_text,
                    facebook_strategy,
                    order
                )

                total_sections += 1
                if prompt:
                    total_prompts += 1

        logger.info(f"\n{'='*50}")
        logger.info(f"✅ MIGRATION COMPLETE!")
        logger.info(f"   Chapters:  {len(chapters)}")
        logger.info(f"   Sections:  {total_sections}")
        logger.info(f"   Prompts:   {total_prompts}")
        logger.info(f"{'='*50}")

        # Verify
        chapter_count = await conn.fetchval("SELECT COUNT(*) FROM image_chapters")
        section_count = await conn.fetchval("SELECT COUNT(*) FROM chapter_sections")
        prompt_count = await conn.fetchval("SELECT COUNT(*) FROM chapter_sections WHERE prompt IS NOT NULL")
        
        logger.info(f"\n📊 Database verification:")
        logger.info(f"   image_chapters:   {chapter_count} rows")
        logger.info(f"   chapter_sections: {section_count} rows")
        logger.info(f"   With prompts:     {prompt_count} rows")

    finally:
        await conn.close()
        logger.info("\n✅ Connection closed. Database ready for chatbot!")


if __name__ == "__main__":
    asyncio.run(migrate())
