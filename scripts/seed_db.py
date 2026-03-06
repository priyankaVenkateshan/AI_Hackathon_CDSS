#!/usr/bin/env python3
"""
Seed CDSS RDS with sample data. Run after migrations.
From repo root: python scripts/seed_db.py [--force]
Requires DATABASE_URL or RDS_CONFIG_SECRET_NAME + AWS_REGION (same as migrations).
"""
import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / "src"
if str(src) not in sys.path:
    sys.path.insert(0, str(src))

from cdss.db.seed import main

if __name__ == "__main__":
    sys.exit(main())
