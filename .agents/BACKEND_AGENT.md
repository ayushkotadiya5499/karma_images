# 🏗️ Webelight Backend Agent — FastAPI Project Structure & Conventions

> **Purpose**: This agent ensures that every new FastAPI backend project follows the exact architectural patterns, file structures, naming conventions, database strategies, Celery setup, error handling, logging, and deployment configurations established in the **ai-code-review-agent** reference project.

---

## 📋 Table of Contents

1. [Project Root Structure](#1-project-root-structure)
2. [Source (`src/`) Directory Layout](#2-source-src-directory-layout)
3. [App Module Pattern (The Core Unit)](#3-app-module-pattern-the-core-unit)
4. [Configuration Management](#4-configuration-management)
5. [Database Layer (`core/db.py`)](#5-database-layer-coredbpy)
6. [Model Conventions](#6-model-conventions)
7. [Schema Conventions (Pydantic)](#7-schema-conventions-pydantic)
8. [Controller/Router Conventions](#8-controllerrouter-conventions)
9. [Service Layer Conventions](#9-service-layer-conventions)
10. [Exception Handling Strategy](#10-exception-handling-strategy)
11. [Constants & Messages](#11-constants--messages)
12. [Authentication & Authorization](#12-authentication--authorization)
13. [Migration Strategy (Alembic)](#13-migration-strategy-alembic)
14. [Celery & Background Tasks](#14-celery--background-tasks)
15. [CLI System (Typer)](#15-cli-system-typer)
16. [Logging Strategy](#16-logging-strategy)
17. [HTTP Client Utility](#17-http-client-utility)
18. [Docker & Deployment](#18-docker--deployment)
19. [Code Quality & Pre-commit](#19-code-quality--pre-commit)
20. [Environment Variables](#20-environment-variables)
21. [Step-by-Step: Creating a New Module](#21-step-by-step-creating-a-new-module)
22. [Anti-Patterns to Avoid](#22-anti-patterns-to-avoid)
23. [Checklist for New Projects](#23-checklist-for-new-projects)

---

## 1. Project Root Structure

```
project-root/
├── .env                          # Environment variables (never commit)
├── .gitignore
├── .pre-commit-config.yaml       # Pre-commit hooks config
├── .pylintrc                     # Pylint rules
├── .mega-linter.yaml             # Mega-Linter config
├── alembic.ini                   # Alembic migration config
├── pyproject.toml                # Poetry dependencies + tool configs
├── poetry.lock
├── README.md
├── env.example                   # Template for .env
├── docker-compose.yml            # Production: app + postgres + redis + celery
├── docker-compose-local.yml      # Local dev: postgres + pgadmin only
├── app.dockerfile                # Production Dockerfile
├── app-dev.dockerfile            # Development Dockerfile
├── sonar-project.properties      # SonarQube config
├── main.py                       # Root entry (delegates to src/main.py)
├── src/                          # ALL application source code
├── frontend/                     # Frontend application (separate)
├── tests/                        # Test suite
├── scripts/                      # Utility scripts
└── docs/                         # Documentation
```

### Key Principle
- **ALL backend source code lives under `src/`**
- The root `main.py` simply imports and runs `src/main.py`
- Poetry manages ALL dependencies via `pyproject.toml`

---

## 2. Source (`src/`) Directory Layout

```
src/
├── __init__.py
├── main.py                       # Entry point: imports CLI
├── cli.py                        # Typer CLI: run, migrate, startapp, worker
├── config.py                     # Pydantic Settings (loads .env)
├── apps/                         # Feature modules (Django-style apps)
│   ├── __init__.py               # Model registry (import ALL models here)
│   ├── server.py                 # FastAPI app factory
│   ├── handlers.py               # Global exception handlers
│   ├── jobs.py                   # Scheduled jobs registry
│   ├── <module>/                 # Each feature is a self-contained module
│   │   ├── __init__.py
│   │   ├── controllers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── models/
│   │   ├── tasks/                # (optional) Celery tasks
│   │   ├── enums.py              # (optional) Module-specific enums
│   │   └── exception.py          # Module-specific exceptions
│   └── utils/                    # Shared app utilities
├── core/                         # Framework-level code
│   ├── auth.py                   # JWT authentication
│   ├── celery_app.py             # Celery application setup
│   ├── common_helpers.py         # Shared business helpers
│   ├── db.py                     # Database engine, session, Base
│   ├── exceptions.py             # Base exception hierarchy
│   ├── gemini_service.py         # AI service integration
│   ├── task/
│   │   └── lifespan.py           # App startup/shutdown lifecycle
│   └── utils/
│       ├── __init__.py           # Exports: HTTPClient, BaseResponse, CamelCaseModel
│       ├── http_client.py        # Async HTTP client wrapper (httpx)
│       ├── mixins.py             # DB model mixins (UUID, Timestamp)
│       ├── schema.py             # Base Pydantic schemas
│       ├── hashing.py            # Password hashing
│       ├── password.py           # Password strength validation
│       ├── scheduler.py          # APScheduler instance
│       ├── set_cookies.py        # Cookie helpers
│       └── webhook.py            # Webhook utilities
├── constants/
│   ├── __init__.py               # Re-exports all constants
│   ├── config.py                 # Business config (rate limits, schemas, prompts)
│   ├── messages.py               # ALL string messages/error texts
│   ├── regex.py                  # Shared regex patterns
│   └── json_config.py            # JSON-based configs
└── migrations/
    ├── env.py                    # Async Alembic environment
    ├── script.py.mako            # Migration template
    └── versions/                 # Auto-generated migration files
```

---

## 3. App Module Pattern (The Core Unit)

Every feature is a **self-contained module** under `src/apps/`. This is the fundamental building block:

```
src/apps/<module_name>/
├── __init__.py               # Module-level imports + router exports
├── exception.py              # Module-specific exceptions
├── enums.py                  # (optional) Module-specific enums
├── controllers/
│   ├── __init__.py           # Re-exports router(s)
│   └── <module_name>.py      # FastAPI router with endpoints
├── schemas/
│   ├── __init__.py           # Re-exports all schemas
│   ├── request.py            # Request/input schemas
│   └── response.py           # Response/output schemas
├── services/
│   ├── __init__.py           # Re-exports service class(es)
│   └── <module_name>.py      # Business logic service class
├── models/
│   ├── __init__.py           # Re-exports model class(es)
│   └── <module_name>.py      # SQLAlchemy ORM models
└── tasks/                    # (optional) Celery background tasks
    ├── __init__.py
    └── <task_name>.py
```

### Rules:
1. **Controllers** only handle HTTP concerns (routing, response wrapping)
2. **Services** contain ALL business logic, receive `AsyncSession` via DI
3. **Models** are pure SQLAlchemy declarations
4. **Schemas** are Pydantic models for input validation & output serialization
5. **Exceptions** are module-specific, inheriting from `core.exceptions`
6. Every module's `__init__.py` re-exports key classes for clean imports

---

## 4. Configuration Management

### Pattern: Pydantic Settings (`src/config.py`)

```python
from enum import StrEnum
from typing import Optional
from dotenv import load_dotenv
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings

load_dotenv(override=False)

class AppEnvironment(StrEnum):
    LOCAL = "Local"
    DEVELOPMENT = "Development"
    PRODUCTION = "Production"

class Settings(BaseSettings):
    # App variables
    ENV: Optional[AppEnvironment] = Field(None, alias="ENV")
    APP_NAME: Optional[str] = Field(None, alias="APP_NAME")
    APP_VERSION: Optional[str] = Field(None, alias="APP_VERSION")
    APP_HOST: Optional[str] = Field(None, alias="APP_HOST")
    APP_PORT: Optional[int] = Field(None, alias="APP_PORT")
    APP_DEBUG: Optional[bool] = Field(False, alias="APP_DEBUG")

    # Database
    DATABASE_USER: Optional[str] = Field(None, alias="DATABASE_USER")
    DATABASE_PASSWORD: Optional[str] = Field(None, alias="DATABASE_PASSWORD")
    DATABASE_HOST: Optional[str] = Field(None, alias="DATABASE_HOST")
    DATABASE_PORT: Optional[str] = Field(None, alias="DATABASE_PORT")
    DATABASE_NAME: Optional[str] = Field(None, alias="DATABASE_NAME")
    DATABASE_URL: Optional[str] = Field(None, alias="DATABASE_URL")

    # JWT
    JWT_SECRET_KEY: Optional[str] = Field(None, alias="JWT_SECRET_KEY")
    JWT_ALGORITHM: Optional[str] = Field(None, alias="JWT_ALGORITHM")
    ACCESS_TOKEN_EXP: Optional[int] = Field(3600, alias="ACCESS_TOKEN_EXP")
    REFRESH_TOKEN_EXP: Optional[int] = Field(86400, alias="REFRESH_TOKEN_EXP")

    # Redis
    REDIS_URL: Optional[str] = Field(None, alias="REDIS_URL")

    # Sentry
    SENTRY_SDK_DSN: Optional[str] = Field(None, alias="SENTRY_SDK_DSN")

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def validate_required(self):
        required_fields = ["ENV", "JWT_SECRET_KEY", "JWT_ALGORITHM",
                           "DATABASE_USER", "DATABASE_PASSWORD",
                           "DATABASE_HOST", "DATABASE_PORT", "DATABASE_NAME"]
        missing = [f for f in required_fields if not getattr(self, f)]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
        return self

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_url(cls, val, values) -> str:
        if isinstance(val, str) and val:
            return val
        # Auto-assemble from components
        user = values.data.get("DATABASE_USER")
        password = values.data.get("DATABASE_PASSWORD")
        host = values.data.get("DATABASE_HOST")
        port = values.data.get("DATABASE_PORT")
        name = values.data.get("DATABASE_NAME")
        return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"

    @property
    def is_production(self) -> bool:
        return self.ENV == AppEnvironment.PRODUCTION

settings = Settings()  # Singleton — import this everywhere
```

### Key Rules:
- **ALL** env vars are defined in `Settings` with `Field` and `alias`
- Use `@model_validator` for cross-field validation
- Use `@field_validator` for computed fields like `DATABASE_URL`
- Export a **singleton** `settings = Settings()` at module level
- Provide `@property` helpers: `is_production`, `is_development`, `is_local`

---

## 5. Database Layer (`core/db.py`)

```python
from typing import AsyncIterator
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from config import settings

engine = create_async_engine(
    str(settings.DATABASE_URL),
    pool_pre_ping=True,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
)

async_session = async_sessionmaker(engine, expire_on_commit=False)

async def db_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: yields a transactional session."""
    async with async_session() as session:
        async with session.begin():
            try:
                yield session
            except Exception:
                await session.rollback()
                raise

class Base(DeclarativeBase):
    """Base class for ALL SQLAlchemy models."""
    pass

redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
```

### Key Rules:
- **Always async**: Use `AsyncSession`, `create_async_engine`, `asyncpg` driver
- **Transaction-per-request**: `db_session()` wraps in `session.begin()` with auto-rollback
- **Connection pooling**: `pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`
- `Base` is the single declarative base — ALL models inherit from it
- Redis client is initialized here for caching and rate limiting

---

## 6. Model Conventions

### Mixins (`core/utils/mixins.py`)

```python
import uuid
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

class TimeStampMixin:
    created_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, server_default=func.now(),
        onupdate=datetime.utcnow, nullable=False,
    )

class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4, nullable=False)

class IntegerPrimaryKeyMixin:
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, nullable=False)
```

### Model Structure

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.db import Base

class User(Base):
    """User model for tracking developers."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="developer", server_default="developer")
    is_active = Column(Boolean, default=True, server_default="true", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    team_memberships = relationship("TeamUser", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.email} - {self.role}>"

    @classmethod
    def from_dict(cls, data: dict):
        return cls(**{k: v for k, v in data.items() if hasattr(cls, k)})
```

### Key Rules:
- Inherit from `Base` (and optionally `UUIDPrimaryKeyMixin`, `TimeStampMixin`)
- Use `__tablename__` explicitly — always lowercase, plural
- Add `index=True` on frequently queried columns
- Use `Column` or `Mapped`/`mapped_column` consistently (project uses both)
- Include `__repr__` for debugging
- Use `@classmethod` factory methods (`from_dict`, `create_user`)
- Define relationships with `cascade="all, delete-orphan"` where appropriate
- Association tables use `UniqueConstraint` for composite uniqueness

### Model Registration (`apps/__init__.py`)

**CRITICAL**: Every model MUST be imported in `apps/__init__.py` for Alembic to detect it:

```python
from core.db import Base
from apps.users.models.user import User
from apps.teams.models.team import Team
from apps.project.models.project import Project
# ... import ALL models

__all__ = ["Base", "User", "Team", "Project", ...]
```

---

## 7. Schema Conventions (Pydantic)

### Base Schemas (`core/utils/schema.py`)

```python
from typing import Any, Generic, TypeVar
from fastapi import status as st
from pydantic import BaseModel
from pydantic.alias_generators import to_camel
import constants.messages as constants

class CamelCaseModel(BaseModel):
    """All schemas inherit from this — auto camelCase aliases."""
    class Config:
        alias_generator = to_camel
        populate_by_name = True
        arbitrary_types_allowed = True
        from_attributes = True

BaseDataField = TypeVar("BaseDataField", bound=CamelCaseModel)

class BaseResponse(CamelCaseModel, Generic[BaseDataField]):
    """Standard API response wrapper."""
    status: str = constants.SUCCESS
    code: int = st.HTTP_200_OK
    data: BaseDataField | None = None

class BaseValidationResponse(CamelCaseModel, Generic[BaseDataField]):
    """Validation error response."""
    status: str = constants.ERROR
    code: int = st.HTTP_422_UNPROCESSABLE_ENTITY
    message: dict
```

### Module Schema Pattern

**`schemas/request.py`** — Input validation:
```python
from pydantic import EmailStr, field_validator
from core.utils.schema import CamelCaseModel

class UserCreate(CamelCaseModel):
    email: EmailStr
    display_name: str

    @field_validator('email')
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()
```

**`schemas/response.py`** — Output serialization:
```python
from datetime import datetime
from typing import Optional, List
from core.utils.schema import CamelCaseModel

class UserResponse(CamelCaseModel):
    id: int
    email: str
    display_name: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
```

### Key Rules:
- **ALL schemas** extend `CamelCaseModel` (auto snake_case → camelCase conversion)
- Request schemas go in `request.py`, response schemas in `response.py`
- Use `field_validator` for input normalization/validation
- Separate request schemas from response schemas (never reuse)
- Response schemas use `from_attributes = True` to serialize ORM objects directly

---

## 8. Controller/Router Conventions

```python
from typing import Annotated
from fastapi import APIRouter, Depends, Query
from apps.users.schemas.user import UserCreate, UserResponse, UserListData
from apps.users.services.user_service import UserService
from core.auth import verify_admin_user
from core.utils.schema import BaseResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("")
async def list_users(
    service: Annotated[UserService, Depends()],
    _: Annotated[str, Depends(verify_admin_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
) -> BaseResponse[UserListData]:
    users = await service.list_users(page, page_size, True)
    total = await service.list_users_count(True)
    return BaseResponse(
        data=UserListData(total=total, users=[UserResponse.model_validate(u) for u in users])
    )

@router.post("")
async def create_user(
    service: Annotated[UserService, Depends()],
    display_name: str = Query(...),
    email: str = Query(...),
) -> BaseResponse[UserCreateData]:
    user, team_name = await service.create_user(display_name, email, "developer", None)
    return BaseResponse(data=UserCreateData(success=True, user_id=user.id, ...))
```

### Key Rules:
- **One router per module file**, prefix = `/<module_name>`
- Use `tags=["<module_name>"]` for Swagger grouping
- Inject services via `Annotated[ServiceClass, Depends()]` (auto DI)
- Auth guards via `Depends(verify_admin_user)` or `Depends(access)`
- **ALWAYS** wrap response in `BaseResponse(data=...)` — unified API format
- Use `Query()` with validation (`ge`, `le`, `...` for required)
- Controllers are THIN — they delegate ALL logic to services
- Return type annotation: `BaseResponse[SpecificDataSchema]`

### Router Registration (`apps/server.py`)

```python
def init_routers(_app: FastAPI) -> None:
    base_router = APIRouter(
        dependencies=[Depends(RateLimiter(times=10, seconds=5))]
    )
    base_router.include_router(users_router)
    base_router.include_router(teams_router)
    # ... add all module routers
    _app.include_router(base_router, prefix="/api", responses={422: {"model": BaseValidationResponse}})
```

---

## 9. Service Layer Conventions

```python
from typing import List, Tuple, Optional
from loguru import logger
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from apps.users.models.user import User
from core.db import db_session as get_db

class UserService:
    """Service for user management business logic."""

    def __init__(self, session: AsyncSession = Depends(get_db)):
        self.session = session

    async def list_users(self, page: int, page_size: int, is_active: bool) -> List[User]:
        query = select(User).where(User.is_active == is_active)
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(User.display_name)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_user(self, user_id: int) -> User:
        result = await self.session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            from apps.users.exception import UserNotFoundException
            raise UserNotFoundException()
        return user

    async def create_user(self, display_name: str, email: str, role: str, team_id: int) -> Tuple[User, Optional[str]]:
        try:
            from apps.users.exception import UserAlreadyExistsException
            existing = await self.session.execute(select(User).where(User.email == email.lower()))
            if existing.scalar_one_or_none():
                raise UserAlreadyExistsException()

            new_user = User(email=email.lower(), display_name=display_name, role=role)
            self.session.add(new_user)
            await self.session.flush()
            return new_user, None
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
```

### Key Rules:
- **Receive `AsyncSession` via `Depends(db_session)`** — auto-injected by FastAPI
- ALL database queries happen in services, never in controllers
- Use `select()` / `func.count()` (SQLAlchemy 2.0 style)
- Use `session.flush()` instead of `session.commit()` (transaction managed by `db_session`)
- Raise module-specific exceptions (not HTTP exceptions directly)
- Log errors with `loguru.logger`
- Return type hints on all methods — use `Tuple` for multi-value returns
- Lazy imports for exceptions within methods to avoid circular imports

---

## 10. Exception Handling Strategy

### Hierarchy (`core/exceptions.py`)

```python
from fastapi import status

class CustomException(Exception):
    status_code = status.HTTP_400_BAD_REQUEST
    message = "Something went wrong!"
    def __init__(self, message: str = None):
        if message:
            self.message = message

class BadRequestError(CustomException):
    status_code = status.HTTP_400_BAD_REQUEST

class UnauthorizedError(CustomException):
    status_code = status.HTTP_401_UNAUTHORIZED

class ForbiddenError(CustomException):
    status_code = status.HTTP_403_FORBIDDEN

class NotFoundError(CustomException):
    status_code = status.HTTP_404_NOT_FOUND

class AlreadyExistsError(CustomException):
    status_code = status.HTTP_409_CONFLICT

class UnprocessableEntityError(CustomException):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
```

### Module Exceptions (`apps/<module>/exception.py`)

```python
import constants.messages as constants
from core.exceptions import NotFoundError, AlreadyExistsError, BadRequestError

class UserNotFoundException(NotFoundError):
    message = constants.USER_NOT_FOUND

class UserAlreadyExistsException(AlreadyExistsError):
    message = constants.USER_ALREADY_EXISTS

class InvalidUserRoleException(BadRequestError):
    message = constants.INVALID_USER_ROLE
```

### Global Handler (`apps/handlers.py`)

```python
def start_exception_handlers(_app: FastAPI) -> None:
    @_app.exception_handler(CustomException)
    async def custom_exception_handler(*args) -> JSONResponse:
        exc = args[1]
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "Error", "code": exc.status_code, "message": exc.message},
        )

    @_app.exception_handler(RequestValidationError)
    async def validation_exception_handler(*args) -> JSONResponse:
        exc = args[1]
        # Transform validation errors into consistent format
        ...
```

### Key Rules:
- Exception messages come from `constants.messages` — NEVER hardcode strings
- Each module has its own `exception.py` inheriting from `core.exceptions`
- The global handler catches `CustomException` and `RequestValidationError`
- Response format is ALWAYS: `{"status": "Error", "code": <int>, "message": <str>}`

---

## 11. Constants & Messages

### `constants/messages.py` — ALL user-facing strings:
```python
SUCCESS = "SUCCESS"
ERROR = "Error"
UNAUTHORIZED = "Unauthorized!"
INVALID_TOKEN = "Invalid Token!"
USER_NOT_FOUND = "User not found"
USER_ALREADY_EXISTS = "User with this email already exists."
# ... every message is a module-level constant
```

### `constants/config.py` — Business configuration:
```python
rate_limiter_config = {"request_limit": 10, "time": 5}
PAYLOAD_TIMEOUT = 5
# Regex patterns, schemas, etc.
```

### `constants/__init__.py` — Re-exports everything:
```python
from constants.messages import SUCCESS, ERROR, ...
from constants.config import PAYLOAD_TIMEOUT, ...
__all__ = ["SUCCESS", "ERROR", "PAYLOAD_TIMEOUT", ...]
```

### Key Rules:
- **NEVER** hardcode strings in controllers/services
- ALL messages defined in `constants/messages.py`
- ALL business config values in `constants/config.py`
- The `__init__.py` re-exports for clean `import constants` usage

---

## 12. Authentication & Authorization

### JWT Token System (`core/auth.py`)

```python
class JWToken(SecurityBase):
    def __init__(self, token_type: Literal["access", "refresh", "admin_access", "admin_refresh"]):
        self.token_type = token_type

    def encode(self, payload: dict, expire_period: int = 3600) -> str:
        return encode({**payload, "type": self.token_type,
                       "exp": datetime.utcnow() + timedelta(seconds=expire_period)},
                      key=settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    def decode(self, token: str) -> dict:
        payload = decode(token, key=settings.JWT_SECRET_KEY, algorithms=settings.JWT_ALGORITHM)
        if payload.get("type") != self.token_type:
            raise UnauthorizedError()
        return payload

# Pre-built instances:
access = JWToken("access")
refresh = JWToken("refresh")
admin_access = JWToken("admin_access")
admin_refresh = JWToken("admin_refresh")
```

### Usage in Controllers:
```python
from core.auth import access, verify_admin_user

@router.get("/protected")
async def protected(token: Annotated[dict, Depends(access)]):
    user_id = token["id"]
    ...

@router.post("/admin-only")
async def admin_only(_: Annotated[str, Depends(verify_admin_user)]):
    ...
```

### Key Rules:
- 4 token types: `access`, `refresh`, `admin_access`, `admin_refresh`
- Tokens extracted from cookies or `Authorization: Bearer` header
- Guards are FastAPI `Depends()` callables
- Token payload includes `{"id": "<user_uuid>", "type": "<token_type>", "exp": ...}`

---

## 13. Migration Strategy (Alembic)

### Config (`alembic.ini`):
```ini
[alembic]
script_location = src/migrations
prepend_sys_path = src
```

### Async Migrations (`src/migrations/env.py`):
```python
import asyncio
from apps import Base          # Imports ALL models
from core.db import engine

target_metadata = Base.metadata

def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table="migrations",     # Custom table name
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations():
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
        await connection.commit()
    await engine.dispose()

asyncio.run(run_async_migrations())
```

### CLI Commands:
```bash
python main.py make-migrations              # Detect changes, generate migration
python main.py make-migrations --message "add users table"
python main.py migrate                       # Apply all pending migrations
python main.py rollback                      # Rollback one migration
```

### Key Rules:
- **ALWAYS** import models in `apps/__init__.py` before running migrations
- Version table is named `"migrations"` (not default `alembic_version`)
- Migrations run async via `asyncio.run()`
- Use `compare_type=True` and `compare_server_default=True`

---

## 14. Celery & Background Tasks

### App Setup (`core/celery_app.py`):

```python
from celery import Celery
from celery.schedules import crontab
from config import settings

celery_app = Celery(
    "code_review_bot",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['apps.review_bot.tasks.review_task']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    broker_connection_retry_on_startup=True,
    beat_schedule={
        'scheduled-task-name': {
            'task': 'task_name',
            'schedule': crontab(hour=2, minute=0),
        },
    },
)
```

### Task Pattern:

```python
@celery_app.task(
    bind=True,
    name="review_mr",
    max_retries=3,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def review_mr(self, vcs_type: str, mr_iid: int, project_path: str, commit_sha: str):
    try:
        result = run_async_task(orchestrator.run_review(...))
        logger.info(f"Task complete: {result}")
    except Exception as e:
        logger.error(f"Task failed: {e}")
        raise self.retry(exc=e, countdown=60)
```

### Async-to-Sync Bridge:

```python
import asyncio
import threading

_loop_lock = threading.Lock()
_global_loop = None

def _get_or_create_loop():
    global _global_loop
    with _loop_lock:
        if _global_loop is None or _global_loop.is_closed():
            _global_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(_global_loop)
        return _global_loop

def run_async_task(coro):
    loop = _get_or_create_loop()
    return loop.run_until_complete(coro)
```

### Key Rules:
- Celery tasks are in `apps/<module>/tasks/` directory
- Use `bind=True` for retry support (`self.retry()`)
- ALL tasks use JSON serialization
- Use the `run_async_task()` bridge for calling async code from sync Celery tasks
- Register beat schedules in `celery_app.conf.update(beat_schedule=...)`
- Sentry integration for production error tracking

---

## 15. CLI System (Typer)

```python
from typer import Typer
cli = Typer(pretty_exceptions_show_locals=False)

@cli.command(help="Run the server")
def run(host: str = None, port: int = None, debug: bool = False):
    uvicorn.run("apps.server:debug_app", host=host, port=port, reload=True)

@cli.command(help="Create a new FastAPI application structure")
def startapp(app_name: str, verbose: bool = False):
    generator = AppGenerator(app_name)
    generator.create_directory_structure()
    # Creates: controllers/, schemas/, services/, models/, exception.py

@cli.command(help="Detect database changes and create migrations")
def make_migrations(message: str = None):
    command.revision(alembic_cfg, message=message, autogenerate=True)

@cli.command(help="Migrate the database")
def migrate():
    command.upgrade(alembic_cfg, "head")

@cli.command(help="Rollback the database by one migration")
def rollback():
    command.downgrade(alembic_cfg, "-1")

@cli.command(help="Run Celery worker")
def worker(loglevel: str = "info", pool: str = None):
    celery_app.worker_main(["worker", f"--loglevel={loglevel}", f"--pool={pool}"])
```

### Available Commands:
| Command | Description |
|---------|-------------|
| `python main.py run` | Start the FastAPI server |
| `python main.py startapp <name>` | Generate a new module with full structure |
| `python main.py make-migrations` | Auto-detect DB changes, create migration |
| `python main.py migrate` | Apply all pending migrations |
| `python main.py rollback` | Rollback one migration |
| `python main.py worker` | Start Celery worker |

---

## 16. Logging Strategy

- **Primary**: `loguru` for structured logging in services and tasks
- **Secondary**: Python `logging` via `uvicorn` logger for HTTP layer
- **Error tracking**: Sentry SDK in production (integrates with Celery too)

```python
from loguru import logger

logger.info(f"User created: {user.email}")
logger.error(f"Error syncing users: {e}")
logger.warning(f"API key rotation: switching to secondary")
logger.debug(f"Review context set: {provider} {repo}#{mr_iid}")
```

---

## 17. HTTP Client Utility

```python
from core.utils.http_client import HTTPClient

client = HTTPClient(base_url="https://api.example.com", headers={"Authorization": "Bearer ..."})
result = await client.get("/endpoint", query_params={"key": "value"})
result = await client.post("/endpoint", json={"data": "value"})
```

- Uses `httpx.AsyncClient` under the hood
- Supports GET, POST, PUT, PATCH, DELETE
- Auto-raises `UnexpectedResponse` on non-2xx status codes
- Supports path params, query params, JSON body, raw content

---

## 18. Docker & Deployment

### `docker-compose.yml` (Production):
```yaml
services:
  app:
    image: ${DOCKER_COMPOSE_IMAGE_NAME}
    depends_on:
      postgresql: { condition: service_healthy }
    env_file: [.env]
    ports: ["${DOCKER_PORT}:80"]

  postgresql:
    image: postgres:alpine3.19
    environment:
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes: [postgresql:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]

  redis-cache:
    image: redis:alpine3.19
    ports: ["6379:6379"]

  celery-worker:
    image: ${DOCKER_COMPOSE_IMAGE_NAME}
    depends_on: [postgresql, redis-cache]
    env_file: [.env]
```

---

## 19. Code Quality & Pre-commit

### `pyproject.toml` tool configs:
```toml
[tool.isort]
profile = "black"

[tool.black]
skip-magic-trailing-comma = true

[tool.ruff]
line-length = 89

[tool.interrogate]
ignore-module = true
fail-under = 100
```

### Pre-commit hooks:
- `black` — code formatting
- `ruff` — linting
- `interrogate` — docstring coverage (100% required)
- `isort` — import ordering

---

## 20. Environment Variables

Every new project MUST have an `env.example`:

```bash
# App
ENV=Local
APP_NAME=MyProject
APP_VERSION=1.0.0
APP_HOST=0.0.0.0
APP_PORT=8080
APP_DEBUG=True

# Database
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myproject_db

# JWT
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXP=3600
REFRESH_TOKEN_EXP=86400

# Redis
REDIS_URL=redis://localhost:6379/0

# Sentry (production only)
SENTRY_SDK_DSN=
```

---

## 21. Step-by-Step: Creating a New Module

### 1. Generate structure:
```bash
python main.py startapp orders
```

### 2. Define model (`apps/orders/models/orders.py`):
```python
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    # ... fields
```

### 3. Register model in `apps/__init__.py`:
```python
from apps.orders.models.orders import Order
```

### 4. Create schemas (`schemas/request.py`, `schemas/response.py`)

### 5. Create service (`services/orders.py`) with DI session

### 6. Create controller (`controllers/orders.py`) with router

### 7. Register router in `apps/server.py`:
```python
from apps.orders.controllers.orders import router as orders_router
base_router.include_router(orders_router)
```

### 8. Create exceptions (`exception.py`)

### 9. Generate migration:
```bash
python main.py make-migrations --message "add orders table"
python main.py migrate
```

---

## 22. Anti-Patterns to Avoid

| ❌ Don't | ✅ Do |
|----------|-------|
| Put business logic in controllers | Put it in services |
| Hardcode error messages | Use `constants.messages` |
| Use `session.commit()` in services | Use `session.flush()` (transaction managed by DI) |
| Create sync database connections | Always use async (`AsyncSession`, `asyncpg`) |
| Skip model registration | ALWAYS import in `apps/__init__.py` |
| Return raw dicts from controllers | Wrap in `BaseResponse(data=...)` |
| Use bare `Exception` for domain errors | Create specific exception classes |
| Import settings from .env directly | Use `from config import settings` |
| Put Celery tasks in service files | Put in `tasks/` directory |
| Use `print()` for logging | Use `loguru.logger` or `core.utils.logger` |

---

## 23. Checklist for New Projects

- [ ] Initialize with `poetry init` + copy `pyproject.toml` tool configs
- [ ] Create `src/` directory structure following Section 2
- [ ] Set up `config.py` with Pydantic Settings
- [ ] Set up `core/db.py` with async engine + session
- [ ] Set up `core/exceptions.py` with base exception hierarchy
- [ ] Set up `core/auth.py` with JWT token system
- [ ] Set up `core/utils/` with mixins, schema, http_client
- [ ] Create `constants/` with messages.py and config.py
- [ ] Create `apps/server.py` with FastAPI factory
- [ ] Create `apps/handlers.py` with global exception handlers
- [ ] Set up `cli.py` with Typer commands
- [ ] Set up `alembic.ini` + `migrations/env.py`
- [ ] Set up `core/celery_app.py` (if using background tasks)
- [ ] Create `core/task/lifespan.py` for app lifecycle
- [ ] Create `.env` and `env.example`
- [ ] Set up `docker-compose.yml` and Dockerfiles
- [ ] Set up `.pre-commit-config.yaml`
- [ ] Create first module using `python main.py startapp <name>`
- [ ] Verify with `python main.py run --debug`

---

> **This agent should be consulted whenever creating a new backend module, setting up a new project, or making architectural decisions. It ensures consistency across all Webelight FastAPI projects.**
