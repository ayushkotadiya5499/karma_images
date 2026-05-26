"""
database.py — PostgreSQL async connection using asyncpg + SQLAlchemy
"""
import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import text
from config import settings
import logging

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────
# SQLAlchemy Async Engine (for ORM)
# ──────────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


# ──────────────────────────────────────────────────────────────────
# Dependency — get DB session
# ──────────────────────────────────────────────────────────────────
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# ──────────────────────────────────────────────────────────────────
# Raw asyncpg pool (used in LangChain tools for fast queries)
# ──────────────────────────────────────────────────────────────────
_pool: asyncpg.Pool = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10,
        )
        logger.info("✅ asyncpg pool created")
    return _pool


async def close_pool():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("✅ asyncpg pool closed")


# ──────────────────────────────────────────────────────────────────
# DB Schema Setup
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

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_chapters_fts ON image_chapters 
    USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));

CREATE INDEX IF NOT EXISTS idx_sections_fts ON chapter_sections 
    USING gin(to_tsvector('english', 
        coalesce(heading,'') || ' ' || 
        coalesce(prompt,'')
    ));
"""


async def create_tables():
    """Create DB tables if they don't exist."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(CREATE_TABLES_SQL)
    logger.info("✅ Database tables ready")
