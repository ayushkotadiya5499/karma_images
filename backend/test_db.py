"""Quick test script to verify DB and imports work."""
import asyncio
import sys

async def test():
    try:
        from config import settings
        from database import get_pool
        
        print(f"Config OK - Model: {settings.GROQ_MODEL}")
        print(f"DB URL: {settings.DATABASE_URL}")
        
        pool = await get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT id, title FROM image_chapters ORDER BY id")
            print(f"\n✅ Connected to DB! Found {len(rows)} chapters:")
            for row in rows:
                print(f"  Ch{row['id']}: {row['title']}")
            
            prompt_count = await conn.fetchval(
                "SELECT COUNT(*) FROM chapter_sections WHERE prompt IS NOT NULL"
            )
            print(f"\n✅ Prompts in DB: {prompt_count}")
        
        await pool.close()
        print("\n✅ All systems OK!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

asyncio.run(test())
