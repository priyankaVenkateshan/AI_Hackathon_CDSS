"""
SQLAlchemy session utilities for CDSS.

Supports:
- Aurora PostgreSQL IAM auth via `RDS_CONFIG_SECRET_NAME` (Secrets Manager)
- Direct `DATABASE_URL` for local dev/tests
"""

from __future__ import annotations

import contextlib
import json
import os
from typing import Iterator

_ENGINE = None


def _build_database_url_from_secret() -> str | None:
    secret_name = os.environ.get("RDS_CONFIG_SECRET_NAME", "").strip()
    if not secret_name:
        return None
    try:
        import boto3
        from urllib.parse import quote_plus

        region = os.environ.get("AWS_REGION", "ap-south-1")
        sm = boto3.client("secretsmanager", region_name=region)
        raw = sm.get_secret_value(SecretId=secret_name).get("SecretString", "{}")
        cfg = json.loads(raw)
        host = cfg.get("host", "")
        port = int(cfg.get("port", 5432))
        database = cfg.get("database", "cdssdb")
        username = cfg.get("username", "")
        if not (host and username and database):
            return None

        rds = boto3.client("rds", region_name=region)
        token = rds.generate_db_auth_token(
            DBHostname=host,
            Port=port,
            DBUsername=username,
            Region=cfg.get("region") or region,
        )
        password = quote_plus(token)
        # IAM auth requires TLS.
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}?sslmode=require"
    except Exception:
        return None


def get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        db_url = _build_database_url_from_secret() or ""
    if not db_url:
        raise RuntimeError("Database not configured. Set DATABASE_URL or RDS_CONFIG_SECRET_NAME.")

    from sqlalchemy import create_engine

    if db_url.startswith("sqlite"):
        _ENGINE = create_engine(db_url, future=True, connect_args={"check_same_thread": False})
        return _ENGINE

    _ENGINE = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=int(os.environ.get("DB_POOL_SIZE", "2")),
        max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    )
    return _ENGINE


@contextlib.contextmanager
def get_session() -> Iterator["Session"]:
    from sqlalchemy.orm import Session

    session = Session(get_engine(), expire_on_commit=False)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """Create tables if they do not exist yet."""
    from cdss.db.models import Base

    Base.metadata.create_all(get_engine())


def get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        db_url = _build_database_url_from_secret() or ""
    if not db_url:
        raise RuntimeError("Database not configured. Set DATABASE_URL or RDS_CONFIG_SECRET_NAME.")

    from sqlalchemy import create_engine

    if db_url.startswith("sqlite"):
        _ENGINE = create_engine(
            db_url,
            future=True,
            connect_args={"check_same_thread": False},
        )
        return _ENGINE

    _ENGINE = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=int(os.environ.get("DB_POOL_SIZE", "2")),
        max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    )
    return _ENGINE


@contextlib.contextmanager
def get_session() -> Iterator["Session"]:
    from sqlalchemy.orm import Session

    session = Session(get_engine(), expire_on_commit=False)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """Create tables if they do not exist yet."""
    from cdss.db.models import Base

    Base.metadata.create_all(get_engine())

"""
SQLAlchemy session utilities.
"""

# from __future__ import annotations

import contextlib
import json
import os
from typing import Iterator

_ENGINE = None


def _build_database_url_from_secret() -> str | None:
    secret_name = os.environ.get("RDS_CONFIG_SECRET_NAME", "").strip()
    if not secret_name:
        return None
    try:
        import boto3
        from urllib.parse import quote_plus

        region = os.environ.get("AWS_REGION", "ap-south-1")
        sm = boto3.client("secretsmanager", region_name=region)
        raw = sm.get_secret_value(SecretId=secret_name).get("SecretString", "{}")
        cfg = json.loads(raw)
        host = cfg.get("host", "")
        port = int(cfg.get("port", 5432))
        database = cfg.get("database", "cdssdb")
        username = cfg.get("username", "")
        if not (host and username and database):
            return None

        rds = boto3.client("rds", region_name=region)
        token = rds.generate_db_auth_token(
            DBHostname=host,
            Port=port,
            DBUsername=username,
            Region=cfg.get("region") or region,
        )
        password = quote_plus(token)
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}?sslmode=require"
    except Exception:
        return None


def get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        db_url = _build_database_url_from_secret() or ""
    if not db_url:
        raise RuntimeError("Set DATABASE_URL or RDS_CONFIG_SECRET_NAME.")

    from sqlalchemy import create_engine

    if db_url.startswith("sqlite"):
        _ENGINE = create_engine(
            db_url,
            future=True,
            connect_args={"check_same_thread": False},
        )
        return _ENGINE

    _ENGINE = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=int(os.environ.get("DB_POOL_SIZE", "2")),
        max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    )
    return _ENGINE


@contextlib.contextmanager
def get_session() -> Iterator["Session"]:
    from sqlalchemy.orm import Session

    session = Session(get_engine(), expire_on_commit=False)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    from cdss.db.models import Base

    Base.metadata.create_all(get_engine())

"""
SQLAlchemy session utilities.

Supports:
- Aurora PostgreSQL IAM auth using `RDS_CONFIG_SECRET_NAME`
- Direct `DATABASE_URL` for local dev/tests
"""

# from __future__ import annotations

import contextlib
import json
import os
from typing import Iterator

_ENGINE = None


def _build_database_url_from_secret() -> str | None:
    secret_name = os.environ.get("RDS_CONFIG_SECRET_NAME", "").strip()
    if not secret_name:
        return None
    try:
        import boto3
        from urllib.parse import quote_plus

        region = os.environ.get("AWS_REGION", "ap-south-1")
        sm = boto3.client("secretsmanager", region_name=region)
        raw = sm.get_secret_value(SecretId=secret_name).get("SecretString", "{}")
        cfg = json.loads(raw)
        host = cfg.get("host", "")
        port = int(cfg.get("port", 5432))
        database = cfg.get("database", "cdssdb")
        username = cfg.get("username", "")
        if not (host and username and database):
            return None

        rds = boto3.client("rds", region_name=region)
        token = rds.generate_db_auth_token(
            DBHostname=host,
            Port=port,
            DBUsername=username,
            Region=cfg.get("region") or region,
        )
        password = quote_plus(token)
        # IAM auth requires TLS.
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}?sslmode=require"
    except Exception:
        return None


def get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        db_url = _build_database_url_from_secret() or ""
    if not db_url:
        raise RuntimeError(
            "Database not configured. Set DATABASE_URL or RDS_CONFIG_SECRET_NAME (Secrets Manager)."
        )

    from sqlalchemy import create_engine

    if db_url.startswith("sqlite"):
        _ENGINE = create_engine(
            db_url,
            future=True,
            connect_args={"check_same_thread": False},
        )
        return _ENGINE

    _ENGINE = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=int(os.environ.get("DB_POOL_SIZE", "2")),
        max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    )
    return _ENGINE


@contextlib.contextmanager
def get_session() -> Iterator["Session"]:
    from sqlalchemy.orm import Session

    engine = get_engine()
    session = Session(engine, expire_on_commit=False)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """Create tables if they do not exist yet."""
    from cdss.db.models import Base

    engine = get_engine()
    Base.metadata.create_all(engine)

"""
SQLAlchemy session utilities.

Supports:
- Aurora PostgreSQL IAM auth using `RDS_CONFIG_SECRET_NAME`
- Direct `DATABASE_URL` for local dev/tests
"""

# from __future__ import annotations

import contextlib
import json
import os
from typing import Iterator


_ENGINE = None


def _build_database_url_from_secret() -> str | None:
    secret_name = os.environ.get("RDS_CONFIG_SECRET_NAME", "").strip()
    if not secret_name:
        return None
    try:
        import boto3
        from urllib.parse import quote_plus

        region = os.environ.get("AWS_REGION", "ap-south-1")
        sm = boto3.client("secretsmanager", region_name=region)
        raw = sm.get_secret_value(SecretId=secret_name).get("SecretString", "{}")
        cfg = json.loads(raw)
        host = cfg.get("host", "")
        port = int(cfg.get("port", 5432))
        database = cfg.get("database", "cdssdb")
        username = cfg.get("username", "")
        if not (host and username and database):
            return None

        rds = boto3.client("rds", region_name=region)
        token = rds.generate_db_auth_token(
            DBHostname=host,
            Port=port,
            DBUsername=username,
            Region=cfg.get("region") or region,
        )
        # IAM auth requires TLS; psycopg2 will accept sslmode=require in query params.
        password = quote_plus(token)
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}?sslmode=require"
    except Exception:
        return None


def get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE

    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        db_url = _build_database_url_from_secret() or ""
    if not db_url:
        raise RuntimeError(
            "Database not configured. Set DATABASE_URL or RDS_CONFIG_SECRET_NAME (Secrets Manager)."
        )

    from sqlalchemy import create_engine

    if db_url.startswith("sqlite"):
        _ENGINE = create_engine(
            db_url,
            future=True,
            connect_args={"check_same_thread": False},
        )
        return _ENGINE

    # Default: PostgreSQL/Aurora
    _ENGINE = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=int(os.environ.get("DB_POOL_SIZE", "2")),
        max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    )
    return _ENGINE


@contextlib.contextmanager
def get_session() -> Iterator["Session"]:
    from sqlalchemy.orm import Session

    engine = get_engine()
    session = Session(engine, expire_on_commit=False)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db() -> None:
    """Create tables if they do not exist yet."""
    from cdss.db.models import Base

    engine = get_engine()
    Base.metadata.create_all(engine)

"""
CDSS data layer – session factory and RDS/Secrets Manager integration.
Use get_session() for all handler DB access; supports DATABASE_URL or RDS_CONFIG_SECRET_NAME (IAM auth).
"""

# from __future__ import annotations

import json
import logging
import os
from contextlib import contextmanager
from typing import Generator

# Load .env from project root if present (optional; requires python-dotenv)
try:
    from dotenv import load_dotenv
    _root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    load_dotenv(os.path.join(_root, ".env"))
except ImportError:
    pass

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

logger = logging.getLogger(__name__)

DATABASE_URL_ENV = "DATABASE_URL"
RDS_CONFIG_SECRET_NAME_ENV = "RDS_CONFIG_SECRET_NAME"
AWS_REGION_ENV = "AWS_REGION"
# When set (e.g. "10021"), use IAM auth but connect to localhost:PORT (SSM tunnel). No master password needed.
TUNNEL_LOCAL_PORT_ENV = "TUNNEL_LOCAL_PORT"

_engine = None
_SessionLocal: sessionmaker | None = None


def _get_rds_url() -> str | None:
    """Build PostgreSQL URL from Secrets Manager (IAM auth). Returns None if secret or env not set."""
    secret_name = os.environ.get(RDS_CONFIG_SECRET_NAME_ENV)
    if not secret_name or not secret_name.strip():
        return None
    try:
        import boto3
        from botocore.exceptions import ClientError
        from urllib.parse import quote_plus

        client = boto3.client("secretsmanager", region_name=os.environ.get(AWS_REGION_ENV) or "ap-south-1")
        resp = client.get_secret_value(SecretId=secret_name)
        raw = resp.get("SecretString")
        if not raw:
            return None
        config = json.loads(raw)
        host = config.get("host")
        port = config.get("port", 5432)
        database = config.get("database", "cdssdb")
        username = config.get("username")
        region = config.get("region") or os.environ.get(AWS_REGION_ENV) or "ap-south-1"
        if not host or not username:
            logger.warning("RDS secret missing host or username")
            return None
        rds_client = boto3.client("rds", region_name=region)
        password = rds_client.generate_db_auth_token(
            DBHostname=host,
            Port=port,
            DBUsername=username,
            Region=region,
        )
        password_escaped = quote_plus(password)
        # If tunneling (e.g. SSM port forward), connect to localhost:local_port but use IAM token for the real host
        tunnel_port = os.environ.get(TUNNEL_LOCAL_PORT_ENV)
        if tunnel_port and tunnel_port.strip():
            host, port = "127.0.0.1", int(tunnel_port.strip())
        return f"postgresql+psycopg2://{username}:{password_escaped}@{host}:{port}/{database}"
    except ClientError as e:
        logger.warning("Secrets Manager get_secret_value failed: %s", e.response.get("Error", {}).get("Code"))
        return None
    except Exception as e:
        logger.warning("RDS URL from secret failed: %s", e)
        return None


def get_engine():
    """Create or return cached SQLAlchemy engine. Uses DATABASE_URL or RDS secret."""
    global _engine
    if _engine is not None:
        return _engine
    # #region agent log
    import time
    _log_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "debug-4da93a.log")
    def _dlog(msg: str, data: dict, hypothesis_id: str):
        try:
            with open(_log_path, "a", encoding="utf-8") as f:
                f.write(__import__("json").dumps({"sessionId": "4da93a", "timestamp": int(time.time() * 1000), "location": "session.get_engine", "message": msg, "data": data, "hypothesisId": hypothesis_id}) + "\n")
        except Exception:
            pass
    # #endregion
    url = os.environ.get(DATABASE_URL_ENV)
    source = "DATABASE_URL" if (url and url.strip()) else "RDS"
    if not url or not url.strip():
        url = _get_rds_url()
    if not url:
        _dlog("no_url", {"source": source}, "H1")
        raise RuntimeError(
            "Database not configured. Set DATABASE_URL for local Postgres or "
            "RDS_CONFIG_SECRET_NAME and AWS_REGION for Aurora IAM auth."
        )
    try:
        from urllib.parse import urlparse
        p = urlparse(url)
        masked = {"host": p.hostname, "port": p.port, "db": p.path.strip("/") if p.path else None, "source": source}
    except Exception:
        masked = {"source": source}
    _dlog("engine_config", masked, "H1")
    if "postgresql://" in url and "postgresql+psycopg2" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
    try:
        _engine = create_engine(url, pool_pre_ping=True, echo=bool(os.environ.get("SQL_ECHO")))
        _dlog("engine_created", {"ok": True}, "H2")
    except Exception as e:
        _dlog("engine_failed", {"error_type": type(e).__name__, "error_msg": str(e)[:500]}, "H2")
        raise
    return _engine


@contextmanager
def get_session(secret_name: str | None = None) -> Generator[Session, None, None]:
    """
    Context manager yielding a SQLAlchemy Session. Commit on exit; rollback on exception.
    secret_name is ignored (kept for API compatibility with code that passes it).
    """
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(bind=get_engine(), autocommit=False, autoflush=False, expire_on_commit=False)
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Canonical implementation (override any duplicated content above).
# ---------------------------------------------------------------------------

_CANON_ENGINE = None


def _canonical_build_database_url_from_secret() -> str | None:
    secret_name = os.environ.get("RDS_CONFIG_SECRET_NAME", "").strip()
    if not secret_name:
        return None
    try:
        import boto3
        from urllib.parse import quote_plus

        region = os.environ.get("AWS_REGION", "ap-south-1")
        sm = boto3.client("secretsmanager", region_name=region)
        raw = sm.get_secret_value(SecretId=secret_name).get("SecretString", "{}")
        cfg = json.loads(raw)
        host = cfg.get("host", "")
        port = int(cfg.get("port", 5432))
        database = cfg.get("database", "cdssdb")
        username = cfg.get("username", "")
        if not (host and username and database):
            return None

        rds = boto3.client("rds", region_name=region)
        token = rds.generate_db_auth_token(
            DBHostname=host,
            Port=port,
            DBUsername=username,
            Region=cfg.get("region") or region,
        )
        password = quote_plus(token)
        return f"postgresql+psycopg2://{username}:{password}@{host}:{port}/{database}?sslmode=require"
    except Exception:
        return None


def _canonical_get_engine():
    global _CANON_ENGINE
    if _CANON_ENGINE is not None:
        return _CANON_ENGINE

    db_url = os.environ.get("DATABASE_URL", "").strip()
    if not db_url:
        db_url = _canonical_build_database_url_from_secret() or ""
    if not db_url:
        raise RuntimeError("Database not configured. Set DATABASE_URL or RDS_CONFIG_SECRET_NAME.")

    from sqlalchemy import create_engine as _create_engine

    if db_url.startswith("sqlite"):
        _CANON_ENGINE = _create_engine(db_url, future=True, connect_args={"check_same_thread": False})
        return _CANON_ENGINE

    _CANON_ENGINE = _create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=int(os.environ.get("DB_POOL_SIZE", "2")),
        max_overflow=int(os.environ.get("DB_MAX_OVERFLOW", "2")),
    )
    return _CANON_ENGINE


@contextlib.contextmanager
def _canonical_get_session() -> Iterator["Session"]:
    from sqlalchemy.orm import Session as _Session

    s = _Session(_canonical_get_engine(), expire_on_commit=False)
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def _canonical_init_db() -> None:
    from cdss.db.models import Base as _Base

    _Base.metadata.create_all(_canonical_get_engine())


# Rebind public API used across handlers.
get_engine = _canonical_get_engine  # type: ignore[assignment]
get_session = _canonical_get_session  # type: ignore[assignment]
init_db = _canonical_init_db  # type: ignore[assignment]
