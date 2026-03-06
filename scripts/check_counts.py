
import os
import sys
from pathlib import Path

# Add src to path
root = Path(__file__).resolve().parent.parent
src = root / "src"
if str(src) not in sys.path:
    sys.path.insert(0, str(src))

from cdss.db.session import get_session
from cdss.db.models import Patient, Surgery

def check_counts():
    print("Checking Aurora database counts...")
    try:
        with get_session() as session:
            p_count = session.query(Patient).count()
            s_count = session.query(Surgery).count()
            print(f"Connection Successful!")
            print(f"Patients: {p_count}")
            print(f"Surgeries: {s_count}")
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    check_counts()
