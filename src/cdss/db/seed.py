"""
Database seeding for quick demos and smoke tests.

Safe to run multiple times (uses upserts/merge).
"""

from __future__ import annotations

from datetime import date, datetime, timezone


def run_seed(force: bool = False) -> dict:
    """
    Seed minimal demo entities used by UI and smoke tests.

    Returns a dict (so `/api/v1/seed` can return JSON payload).
    """
    from sqlalchemy import select

    from cdss.db.models import Patient, Resource
    from cdss.db.session import get_session, init_db

    init_db()

    seeded = {"patients": 0, "resources": 0}
    with get_session() as session:
        has_patients = session.scalar(select(Patient.id).limit(1)) is not None
        has_resources = session.scalar(select(Resource.id).limit(1)) is not None

        if force or not has_patients:
            now = datetime.now(timezone.utc)
            demo_patients = [
                Patient(
                    id="PT-1001",
                    name="Rajesh Kumar",
                    date_of_birth=date(1980, 5, 2),
                    gender="male",
                    language="en",
                    conditions=["Hypertension"],
                    vitals={"hr": 78, "bp": "130/85", "spo2": 97},
                    severity="MODERATE",
                    status="Stable",
                    created_at=now,
                    updated_at=now,
                ),
                Patient(
                    id="PT-1002",
                    name="Ananya Singh",
                    date_of_birth=date(1992, 8, 17),
                    gender="female",
                    language="en",
                    conditions=["Diabetes"],
                    vitals={"hr": 72, "bp": "120/80", "spo2": 99},
                    severity="LOW",
                    status="Ready for Discharge",
                    created_at=now,
                    updated_at=now,
                ),
            ]
            for p in demo_patients:
                session.merge(p)
            seeded["patients"] = len(demo_patients)

        if force or not has_resources:
            demo_resources = [
                Resource(id="OT-1", type="ot", name="OT 1", status="available", availability={"area": "Main", "floor": "2"}),
                Resource(id="EQ-1", type="equipment", name="Ventilator", status="available", availability={"location": "ICU"}),
                Resource(id="DR-100", type="staff", name="Dr. Priya Sharma", status="available", availability={"specialty": "General Medicine"}),
            ]
            for r in demo_resources:
                session.merge(r)
            seeded["resources"] = len(demo_resources)

    return {"ok": True, "seeded": seeded}

"""
Database seeding for quick demos and smoke tests.

This is intentionally conservative (idempotent where possible) and safe to run multiple times.
"""

# from __future__ import annotations

from datetime import date, datetime, timezone


def run_seed(force: bool = False) -> dict:
    from sqlalchemy import select

    from cdss.db.models import Patient, Resource
    from cdss.db.session import get_session, init_db

    init_db()

    seeded = {"patients": 0, "resources": 0}
    with get_session() as session:
        has_patients = session.scalar(select(Patient.id).limit(1)) is not None
        has_resources = session.scalar(select(Resource.id).limit(1)) is not None

        if force or not has_patients:
            now = datetime.now(timezone.utc)
            demo_patients = [
                Patient(
                    id="PT-1001",
                    name="Rajesh Kumar",
                    date_of_birth=date(1980, 5, 2),
                    gender="male",
                    language="en",
                    conditions=["Hypertension"],
                    vitals={"hr": 78, "bp": "130/85", "spo2": 97},
                    severity="MODERATE",
                    status="Stable",
                    created_at=now,
                    updated_at=now,
                ),
                Patient(
                    id="PT-1002",
                    name="Ananya Singh",
                    date_of_birth=date(1992, 8, 17),
                    gender="female",
                    language="en",
                    conditions=["Diabetes"],
                    vitals={"hr": 72, "bp": "120/80", "spo2": 99},
                    severity="LOW",
                    status="Ready for Discharge",
                    created_at=now,
                    updated_at=now,
                ),
            ]
            for p in demo_patients:
                session.merge(p)
            seeded["patients"] = len(demo_patients)

        if force or not has_resources:
            demo_resources = [
                Resource(id="OT-1", type="ot", name="OT 1", status="available", availability={"area": "Main", "floor": "2"}),
                Resource(id="EQ-1", type="equipment", name="Ventilator", status="available", availability={"location": "ICU"}),
                Resource(id="DR-100", type="staff", name="Dr. Priya Sharma", status="available", availability={"specialty": "General Medicine"}),
            ]
            for r in demo_resources:
                session.merge(r)
            seeded["resources"] = len(demo_resources)

    return {"ok": True, "seeded": seeded}

"""
Seed CDSS RDS with comprehensive sample data for development and testing.
Usage: python -m cdss.db.seed [--force]
Uses DATABASE_URL or RDS_CONFIG_SECRET_NAME + AWS_REGION. With --force, clears existing seed data and re-inserts.
"""

# from __future__ import annotations

import argparse
import sys
from datetime import date, datetime, timedelta, timezone


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _days_ago(n: int) -> date:
    return (datetime.now(timezone.utc) - timedelta(days=n)).date()


def _hours_from_now(n: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=n)


def run_seed(force: bool = False) -> int:
    # #region agent log
    import time as _time
    _seed_file = __import__("os").path.abspath(__file__)
    _repo_root = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.dirname(_seed_file))))
    _log_path = __import__("os").path.join(_repo_root, "debug-4da93a.log")
    def _dlog(msg, data, hypothesis_id):
        try:
            with open(_log_path, "a", encoding="utf-8") as _f:
                _f.write(__import__("json").dumps({"sessionId": "4da93a", "timestamp": int(_time.time() * 1000), "location": "seed.run_seed", "message": msg, "data": data, "hypothesisId": hypothesis_id}) + "\n")
        except Exception:
            pass
    _dlog("run_seed_entry", {"force": force}, "H4")
    # #endregion
    from cdss.db.session import get_session
    from cdss.db.models import (
        AuditLog,
        Consent,
        Hospital,
        Medication,
        Patient,
        Reminder,
        Resource,
        ScheduleSlot,
        Surgery,
        Visit,
    )

    with get_session() as session:
        # #region agent log
        _dlog("session_acquired", {"ok": True}, "H2")
        # #endregion
        from sqlalchemy import func, select

        existing = session.scalar(select(func.count(Patient.id)))
        # #region agent log
        _dlog("existing_count", {"patient_count": existing}, "H4")
        # #endregion
        if existing and existing > 0 and not force:
            print("Seed data already present (patients exist). Use --force to replace.")
            return 0

        if force and existing and existing > 0:
            from sqlalchemy import delete
            for model in [Consent, Reminder, Medication, ScheduleSlot, Visit, Surgery, Resource, Hospital, Patient, AuditLog]:
                session.execute(delete(model))
            session.flush()
            print("Cleared existing seed data.")

        # ─── Hospitals ─────────────────────────────────────────────────
        hospitals_data = [
            {
                "id": "HOSP-001", "name": "AIIMS Delhi", "city": "New Delhi", "state": "Delhi",
                "district": "South Delhi", "pincode": "110029",
                "specialties": ["Cardiology", "Neurology", "Oncology", "Orthopedics", "General Surgery", "Trauma"],
                "total_beds": 2500, "available_beds": 340, "icu_beds": 200, "available_icu_beds": 28,
                "tier": "tertiary", "emergency_available": True,
                "contact_phone": "+91-11-26588500", "latitude": 28.5672, "longitude": 77.2100,
                "status": "active", "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "HOSP-002", "name": "Apollo Hospital Mumbai", "city": "Mumbai", "state": "Maharashtra",
                "district": "Navi Mumbai", "pincode": "400614",
                "specialties": ["Cardiology", "Gastroenterology", "Nephrology", "Oncology", "Orthopedics"],
                "total_beds": 700, "available_beds": 85, "icu_beds": 60, "available_icu_beds": 12,
                "tier": "tertiary", "emergency_available": True,
                "contact_phone": "+91-22-33501000", "latitude": 19.0540, "longitude": 73.0190,
                "status": "active", "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "HOSP-003", "name": "Fortis Hospital Bengaluru", "city": "Bengaluru", "state": "Karnataka",
                "district": "Bengaluru Urban", "pincode": "560076",
                "specialties": ["Cardiology", "Neurology", "Pulmonology", "Urology"],
                "total_beds": 500, "available_beds": 62, "icu_beds": 45, "available_icu_beds": 8,
                "tier": "tertiary", "emergency_available": True,
                "contact_phone": "+91-80-66214444", "latitude": 12.9585, "longitude": 77.6484,
                "status": "active", "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "HOSP-004", "name": "CMC Vellore", "city": "Vellore", "state": "Tamil Nadu",
                "district": "Vellore", "pincode": "632004",
                "specialties": ["General Medicine", "Pediatrics", "Ophthalmology", "ENT", "Dermatology"],
                "total_beds": 2700, "available_beds": 410, "icu_beds": 180, "available_icu_beds": 35,
                "tier": "tertiary", "emergency_available": True,
                "contact_phone": "+91-416-2281000", "latitude": 12.9249, "longitude": 79.1325,
                "status": "active", "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "HOSP-005", "name": "Medanta Gurugram", "city": "Gurugram", "state": "Haryana",
                "district": "Gurugram", "pincode": "122001",
                "specialties": ["Cardiac Surgery", "Liver Transplant", "Oncology", "Robotics Surgery"],
                "total_beds": 1600, "available_beds": 195, "icu_beds": 120, "available_icu_beds": 18,
                "tier": "tertiary", "emergency_available": True,
                "contact_phone": "+91-124-4141414", "latitude": 28.4395, "longitude": 77.0426,
                "status": "active", "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "HOSP-006", "name": "Government General Hospital Chennai", "city": "Chennai", "state": "Tamil Nadu",
                "district": "Chennai", "pincode": "600003",
                "specialties": ["General Medicine", "General Surgery", "Orthopedics", "Obstetrics"],
                "total_beds": 3000, "available_beds": 520, "icu_beds": 100, "available_icu_beds": 15,
                "tier": "secondary", "emergency_available": True,
                "contact_phone": "+91-44-25305000", "latitude": 13.0790, "longitude": 80.2750,
                "status": "active", "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "HOSP-007", "name": "Narayana Health Jaipur", "city": "Jaipur", "state": "Rajasthan",
                "district": "Jaipur", "pincode": "302017",
                "specialties": ["Cardiac Surgery", "Cardiology", "Orthopedics", "Neurosurgery"],
                "total_beds": 400, "available_beds": 55, "icu_beds": 40, "available_icu_beds": 7,
                "tier": "secondary", "emergency_available": True,
                "contact_phone": "+91-141-4922222", "latitude": 26.8561, "longitude": 75.8115,
                "status": "active", "created_at": _now(), "updated_at": _now(),
            },
        ]
        for h in hospitals_data:
            session.add(Hospital(**h))
        session.flush()
        # #region agent log
        _dlog("hospitals_flush_ok", {"count": len(hospitals_data)}, "H4")
        # #endregion

        # ─── Patients (15 diverse Indian patients) ────────────────────
        patients_data = [
            {
                "id": "PT-1001", "name": "Rajesh Kumar", "date_of_birth": date(1985, 3, 15),
                "gender": "M", "language": "hi", "abha_id": "91-1234-5678-9012",
                "conditions": ["Hypertension", "Type 2 Diabetes"],
                "allergies": ["Penicillin"],
                "blood_group": "B+", "ward": "Ward A", "severity": "moderate", "status": "active",
                "vitals": {"bp": "130/82", "hr": 78, "temp": 98.4, "spo2": 97},
                "surgery_readiness": {"cleared": True, "notes": "Pre-op labs complete"},
                "last_visit": _days_ago(5), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1002", "name": "Priya Sharma", "date_of_birth": date(1992, 7, 8),
                "gender": "F", "language": "en", "abha_id": None,
                "conditions": ["Asthma"], "allergies": [],
                "blood_group": "O+", "ward": None, "severity": "low", "status": "active",
                "vitals": {"bp": "118/76", "hr": 72, "spo2": 98},
                "surgery_readiness": {},
                "last_visit": _days_ago(2), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1003", "name": "Amit Patel", "date_of_birth": date(1978, 11, 22),
                "gender": "M", "language": "gu", "abha_id": None,
                "conditions": ["COPD", "Hypertension"], "allergies": ["Sulfa"],
                "blood_group": "A+", "ward": "Ward B", "severity": "high", "status": "active",
                "vitals": {"bp": "142/88", "hr": 85, "spo2": 94},
                "surgery_readiness": {"cleared": False, "notes": "Cardiology clearance required"},
                "last_visit": _days_ago(3), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1004", "name": "Sunita Devi", "date_of_birth": date(1965, 1, 10),
                "gender": "F", "language": "hi", "abha_id": "91-2345-6789-0123",
                "conditions": ["Chronic Kidney Disease Stage 3", "Anemia"],
                "allergies": ["Aspirin"],
                "blood_group": "AB+", "ward": "Ward C", "severity": "high", "status": "active",
                "vitals": {"bp": "155/95", "hr": 88, "temp": 98.6, "spo2": 95, "creatinine": 3.2},
                "surgery_readiness": {"cleared": False, "notes": "Nephrology review pending"},
                "last_visit": _days_ago(1), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1005", "name": "Vikram Singh", "date_of_birth": date(1990, 5, 25),
                "gender": "M", "language": "hi", "abha_id": None,
                "conditions": ["Fracture — Right Femur"], "allergies": [],
                "blood_group": "O-", "ward": "Ortho Ward", "severity": "moderate", "status": "active",
                "vitals": {"bp": "120/78", "hr": 90, "temp": 99.1, "spo2": 98},
                "surgery_readiness": {"cleared": True, "notes": "Fitness cleared"},
                "last_visit": _days_ago(0), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1006", "name": "Lakshmi Iyer", "date_of_birth": date(1958, 9, 3),
                "gender": "F", "language": "ta", "abha_id": "91-3456-7890-1234",
                "conditions": ["Coronary Artery Disease", "Type 2 Diabetes", "Hypothyroidism"],
                "allergies": ["Metformin"],
                "blood_group": "B-", "ward": "CCU", "severity": "critical", "status": "active",
                "vitals": {"bp": "160/100", "hr": 110, "temp": 100.2, "spo2": 92},
                "surgery_readiness": {"cleared": False, "notes": "Cardiac catheterization scheduled"},
                "last_visit": _days_ago(0), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1007", "name": "Mohammed Farooq", "date_of_birth": date(1975, 12, 18),
                "gender": "M", "language": "ur", "abha_id": None,
                "conditions": ["Gallstones", "Fatty Liver"], "allergies": [],
                "blood_group": "A-", "ward": "Ward A", "severity": "moderate", "status": "active",
                "vitals": {"bp": "125/80", "hr": 76, "temp": 98.6, "spo2": 99},
                "surgery_readiness": {"cleared": True, "notes": "For laparoscopic cholecystectomy"},
                "last_visit": _days_ago(7), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1008", "name": "Ananya Reddy", "date_of_birth": date(2000, 4, 14),
                "gender": "F", "language": "te", "abha_id": None,
                "conditions": ["Iron Deficiency Anemia"], "allergies": [],
                "blood_group": "O+", "ward": None, "severity": "low", "status": "active",
                "vitals": {"bp": "105/68", "hr": 80, "temp": 98.4, "spo2": 99, "hemoglobin": 9.2},
                "surgery_readiness": {},
                "last_visit": _days_ago(14), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1009", "name": "Ramesh Gupta", "date_of_birth": date(1970, 8, 30),
                "gender": "M", "language": "hi", "abha_id": "91-4567-8901-2345",
                "conditions": ["Ischemic Stroke — Recovered", "Atrial Fibrillation"],
                "allergies": ["Ibuprofen"],
                "blood_group": "A+", "ward": "Neuro Ward", "severity": "high", "status": "active",
                "vitals": {"bp": "138/85", "hr": 95, "temp": 98.2, "spo2": 96},
                "surgery_readiness": {"cleared": False, "notes": "On anticoagulants"},
                "last_visit": _days_ago(2), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1010", "name": "Kavita Joshi", "date_of_birth": date(1988, 6, 20),
                "gender": "F", "language": "mr", "abha_id": None,
                "conditions": ["Gestational Diabetes"], "allergies": [],
                "blood_group": "B+", "ward": "Maternity", "severity": "moderate", "status": "active",
                "vitals": {"bp": "122/78", "hr": 82, "temp": 98.6, "spo2": 99, "fbs": 145},
                "surgery_readiness": {},
                "last_visit": _days_ago(1), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1011", "name": "Arjun Nair", "date_of_birth": date(1982, 2, 5),
                "gender": "M", "language": "ml", "abha_id": None,
                "conditions": ["Lumbar Disc Herniation"], "allergies": ["Codeine"],
                "blood_group": "AB-", "ward": "Ortho Ward", "severity": "moderate", "status": "active",
                "vitals": {"bp": "128/82", "hr": 74, "temp": 98.4, "spo2": 98},
                "surgery_readiness": {"cleared": True, "notes": "For microdiscectomy"},
                "last_visit": _days_ago(4), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1012", "name": "Deepika Chauhan", "date_of_birth": date(1995, 10, 12),
                "gender": "F", "language": "hi", "abha_id": None,
                "conditions": ["Appendicitis — Acute"], "allergies": [],
                "blood_group": "O+", "ward": "Emergency", "severity": "high", "status": "active",
                "vitals": {"bp": "115/72", "hr": 98, "temp": 101.3, "spo2": 98, "wbc": 14500},
                "surgery_readiness": {"cleared": True, "notes": "Emergency appendectomy"},
                "last_visit": _days_ago(0), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1013", "name": "Suresh Yadav", "date_of_birth": date(1960, 3, 28),
                "gender": "M", "language": "hi", "abha_id": "91-5678-9012-3456",
                "conditions": ["Prostate Cancer Stage II", "BPH"],
                "allergies": ["Ciprofloxacin"],
                "blood_group": "A+", "ward": "Ward D", "severity": "high", "status": "active",
                "vitals": {"bp": "135/85", "hr": 72, "temp": 98.4, "spo2": 97, "psa": 8.5},
                "surgery_readiness": {"cleared": True, "notes": "Scheduled for TURP"},
                "last_visit": _days_ago(3), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1014", "name": "Meera Pillai", "date_of_birth": date(2015, 11, 7),
                "gender": "F", "language": "ml", "abha_id": None,
                "conditions": ["Tonsillitis — Recurrent"], "allergies": [],
                "blood_group": "B+", "ward": "Pediatrics", "severity": "low", "status": "active",
                "vitals": {"bp": "95/60", "hr": 100, "temp": 99.8, "spo2": 98},
                "surgery_readiness": {"cleared": True, "notes": "For tonsillectomy"},
                "last_visit": _days_ago(6), "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "PT-1015", "name": "Harish Menon", "date_of_birth": date(1972, 7, 15),
                "gender": "M", "language": "kn", "abha_id": None,
                "conditions": ["Cataracts — Bilateral"], "allergies": [],
                "blood_group": "O+", "ward": None, "severity": "low", "status": "discharged",
                "vitals": {"bp": "120/80", "hr": 68, "temp": 98.4, "spo2": 99},
                "surgery_readiness": {"cleared": True, "notes": "Post-op day 3, left eye done"},
                "last_visit": _days_ago(10), "created_at": _now(), "updated_at": _now(),
            },
        ]
        for p in patients_data:
            session.add(Patient(**p))
        session.flush()

        # ─── Visits ────────────────────────────────────────────────────
        visits_data = [
            {"patient_id": "PT-1001", "doctor_id": "DOC-001", "visit_date": _days_ago(5), "notes": "Routine follow-up. BP controlled on amlodipine.", "summary": "Hypertension stable. HbA1c 7.0.", "created_at": _now()},
            {"patient_id": "PT-1001", "doctor_id": "DOC-001", "visit_date": _days_ago(35), "notes": "Diabetes review. Dose titrated.", "summary": "HbA1c 7.2. Metformin increased to 1g BD.", "created_at": _now()},
            {"patient_id": "PT-1002", "doctor_id": "DOC-002", "visit_date": _days_ago(2), "notes": "Asthma check. Inhaler technique reviewed.", "summary": "Asthma well controlled. PFT normal.", "created_at": _now()},
            {"patient_id": "PT-1003", "doctor_id": "DOC-001", "visit_date": _days_ago(3), "notes": "COPD exacerbation follow-up. Improved on steroids.", "summary": "Continue inhalers, taper prednisolone.", "created_at": _now()},
            {"patient_id": "PT-1004", "doctor_id": "DOC-003", "visit_date": _days_ago(1), "notes": "CKD review. Creatinine rising, refer nephrology.", "summary": "CKD Stage 3b progressing. Restrict protein.", "created_at": _now()},
            {"patient_id": "PT-1005", "doctor_id": "DOC-004", "visit_date": _days_ago(0), "notes": "Admitted after RTA. Right femur fracture confirmed on X-ray.", "summary": "Plan: ORIF right femur tomorrow.", "created_at": _now()},
            {"patient_id": "PT-1006", "doctor_id": "DOC-005", "visit_date": _days_ago(0), "notes": "Chest pain, troponin elevated. ECG: ST depression V3-V6.", "summary": "NSTEMI. Started on dual antiplatelet, heparin, statin.", "created_at": _now()},
            {"patient_id": "PT-1007", "doctor_id": "DOC-006", "visit_date": _days_ago(7), "notes": "Ultrasound confirms multiple gallstones. Symptomatic.", "summary": "Elective laparoscopic cholecystectomy planned.", "created_at": _now()},
            {"patient_id": "PT-1009", "doctor_id": "DOC-007", "visit_date": _days_ago(2), "notes": "Post-stroke review. Warfarin INR 2.5.", "summary": "Stable on anticoagulation therapy. Physiotherapy ongoing.", "created_at": _now()},
            {"patient_id": "PT-1010", "doctor_id": "DOC-008", "visit_date": _days_ago(1), "notes": "GDM monitoring. FBS 145, insulin started.", "summary": "Gestational diabetes: insulin 10 units pre-dinner.", "created_at": _now()},
            {"patient_id": "PT-1012", "doctor_id": "DOC-006", "visit_date": _days_ago(0), "notes": "Acute abdomen. CT confirms appendicitis.", "summary": "Emergency appendectomy tonight.", "created_at": _now()},
            {"patient_id": "PT-1013", "doctor_id": "DOC-009", "visit_date": _days_ago(3), "notes": "PSA 8.5. Biopsy confirms Gleason 3+4.", "summary": "Prostate Ca Stage II. TURP scheduled.", "created_at": _now()},
            {"patient_id": "PT-1015", "doctor_id": "DOC-010", "visit_date": _days_ago(10), "notes": "Post-op cataract surgery left eye. Vision 6/9.", "summary": "Good recovery. Right eye surgery in 6 weeks.", "created_at": _now()},
        ]
        for v in visits_data:
            session.add(Visit(**v))
        session.flush()

        # ─── Surgeries (10+ with varied statuses) ─────────────────────
        surgeries_data = [
            {
                "id": "SRG-001", "patient_id": "PT-1001", "surgeon_id": "DOC-006",
                "type": "Laparoscopic Cholecystectomy", "ot_id": "OT-1",
                "scheduled_date": _days_ago(-2), "scheduled_time": "09:00",
                "duration_minutes": 90, "status": "scheduled",
                "checklist": [
                    {"id": 1, "text": "Confirm patient identity and consent", "completed": True},
                    {"id": 2, "text": "Marking of surgical site", "completed": False},
                    {"id": 3, "text": "Anesthesia safety check", "completed": False},
                ],
                "requirements": {"instruments": ["Laparoscope", "Graspers", "Clip applier"], "complexity": "Moderate"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-002", "patient_id": "PT-1003", "surgeon_id": "DOC-010",
                "type": "Cataract Surgery", "ot_id": "OT-2",
                "scheduled_date": _days_ago(-5), "scheduled_time": "11:00",
                "duration_minutes": 45, "status": "scheduled",
                "checklist": [{"id": 1, "text": "Eye drops instilled", "completed": True}],
                "requirements": {"instruments": ["Phaco machine", "IOL"], "complexity": "Low"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-003", "patient_id": "PT-1005", "surgeon_id": "DOC-004",
                "type": "ORIF Right Femur", "ot_id": "OT-1",
                "scheduled_date": _days_ago(-1), "scheduled_time": "08:00",
                "duration_minutes": 180, "status": "scheduled",
                "checklist": [
                    {"id": 1, "text": "Blood group and crossmatch", "completed": True},
                    {"id": 2, "text": "Consent signed", "completed": True},
                    {"id": 3, "text": "Implant plate and screws available", "completed": True},
                ],
                "requirements": {"instruments": ["Orthopedic drill", "DHS plate", "Fluoroscopy"], "complexity": "High", "blood_units": 2},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-004", "patient_id": "PT-1006", "surgeon_id": "DOC-005",
                "type": "Coronary Angioplasty (PCI)", "ot_id": "OT-3",
                "scheduled_date": _days_ago(-1), "scheduled_time": "14:00",
                "duration_minutes": 120, "status": "scheduled",
                "checklist": [
                    {"id": 1, "text": "Dual antiplatelet loading dose", "completed": True},
                    {"id": 2, "text": "Cath lab availability confirmed", "completed": True},
                ],
                "requirements": {"instruments": ["Cath lab", "DES stents", "IABP on standby"], "complexity": "High"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-005", "patient_id": "PT-1007", "surgeon_id": "DOC-006",
                "type": "Laparoscopic Cholecystectomy", "ot_id": "OT-2",
                "scheduled_date": _days_ago(-3), "scheduled_time": "10:00",
                "duration_minutes": 75, "status": "scheduled",
                "checklist": [
                    {"id": 1, "text": "NPO since midnight", "completed": False},
                    {"id": 2, "text": "Consent signed", "completed": True},
                ],
                "requirements": {"instruments": ["Laparoscope", "Graspers", "Clip applier"], "complexity": "Moderate"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-006", "patient_id": "PT-1011", "surgeon_id": "DOC-004",
                "type": "Lumbar Microdiscectomy", "ot_id": "OT-1",
                "scheduled_date": _days_ago(-4), "scheduled_time": "07:30",
                "duration_minutes": 120, "status": "scheduled",
                "checklist": [
                    {"id": 1, "text": "MRI reviewed", "completed": True},
                    {"id": 2, "text": "Consent signed", "completed": True},
                ],
                "requirements": {"instruments": ["Microscope", "Kerrison rongeurs", "Nerve retractor"], "complexity": "Moderate"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-007", "patient_id": "PT-1012", "surgeon_id": "DOC-006",
                "type": "Emergency Appendectomy", "ot_id": "OT-3",
                "scheduled_date": _days_ago(0), "scheduled_time": "22:00",
                "duration_minutes": 60, "status": "in_progress",
                "checklist": [
                    {"id": 1, "text": "Consent signed", "completed": True},
                    {"id": 2, "text": "IV antibiotics started", "completed": True},
                    {"id": 3, "text": "Time-out completed", "completed": True},
                ],
                "requirements": {"instruments": ["Laparoscope", "Graspers", "Stapler"], "complexity": "Low"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-008", "patient_id": "PT-1013", "surgeon_id": "DOC-009",
                "type": "TURP (Transurethral Resection of Prostate)", "ot_id": "OT-2",
                "scheduled_date": _days_ago(-2), "scheduled_time": "09:00",
                "duration_minutes": 90, "status": "scheduled",
                "checklist": [
                    {"id": 1, "text": "Blood group and crossmatch", "completed": True},
                    {"id": 2, "text": "Urologist consent", "completed": True},
                ],
                "requirements": {"instruments": ["Resectoscope", "Irrigation system"], "complexity": "Moderate"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-009", "patient_id": "PT-1014", "surgeon_id": "DOC-011",
                "type": "Tonsillectomy", "ot_id": "OT-2",
                "scheduled_date": _days_ago(-6), "scheduled_time": "08:00",
                "duration_minutes": 40, "status": "scheduled",
                "checklist": [
                    {"id": 1, "text": "Pediatric anesthesia clearance", "completed": True},
                    {"id": 2, "text": "Parent consent", "completed": True},
                ],
                "requirements": {"instruments": ["Coblator", "Bipolar cautery"], "complexity": "Low"},
                "created_at": _now(), "updated_at": _now(),
            },
            {
                "id": "SRG-010", "patient_id": "PT-1015", "surgeon_id": "DOC-010",
                "type": "Cataract Surgery — Left Eye", "ot_id": "OT-2",
                "scheduled_date": _days_ago(10), "scheduled_time": "10:00",
                "duration_minutes": 40, "status": "completed",
                "checklist": [
                    {"id": 1, "text": "Eye drops instilled", "completed": True},
                    {"id": 2, "text": "IOL power confirmed", "completed": True},
                ],
                "requirements": {"instruments": ["Phaco machine", "IOL +22D"], "complexity": "Low"},
                "created_at": _now(), "updated_at": _now(),
            },
        ]
        for s in surgeries_data:
            session.add(Surgery(**s))
        session.flush()

        # ─── Resources (OTs, equipment, staff) ─────────────────────────
        resources_data = [
            {"id": "OT-1", "type": "ot", "name": "Operation Theater 1 – General/Ortho", "status": "available", "availability": {"nextFree": None, "area": "Block A", "floor": 3}, "last_updated": _now()},
            {"id": "OT-2", "type": "ot", "name": "Operation Theater 2 – Minor/Eye/ENT", "status": "available", "availability": {"nextFree": None, "area": "Block A", "floor": 3}, "last_updated": _now()},
            {"id": "OT-3", "type": "ot", "name": "Operation Theater 3 – Cardiac/Emergency", "status": "busy", "availability": {"nextFree": "23:30", "area": "Block B", "floor": 2}, "last_updated": _now()},
            {"id": "OT-4", "type": "ot", "name": "Operation Theater 4 – Neuro", "status": "maintenance", "availability": {"nextFree": None, "area": "Block B", "floor": 2, "maintenanceReason": "AC repair"}, "last_updated": _now()},
            {"id": "EQ-VENT-01", "type": "equipment", "name": "Ventilator V1", "status": "available", "availability": {"location": "ICU-A", "assignedTo": None}, "last_updated": _now()},
            {"id": "EQ-VENT-02", "type": "equipment", "name": "Ventilator V2", "status": "in_use", "availability": {"location": "ICU-A", "assignedTo": "PT-1006"}, "last_updated": _now()},
            {"id": "EQ-VENT-03", "type": "equipment", "name": "Ventilator V3", "status": "available", "availability": {"location": "ICU-B", "assignedTo": None}, "last_updated": _now()},
            {"id": "EQ-ECG-01", "type": "equipment", "name": "ECG Machine 1", "status": "available", "availability": {"location": "Ward A", "assignedTo": None}, "last_updated": _now()},
            {"id": "EQ-DEFI-01", "type": "equipment", "name": "Defibrillator 1", "status": "available", "availability": {"location": "Emergency", "assignedTo": None}, "last_updated": _now()},
            {"id": "EQ-XRAY-01", "type": "equipment", "name": "Portable X-Ray", "status": "in_use", "availability": {"location": "Ortho Ward", "assignedTo": "PT-1005"}, "last_updated": _now()},
            {"id": "EQ-USG-01", "type": "equipment", "name": "Ultrasound Machine", "status": "available", "availability": {"location": "Radiology", "assignedTo": None}, "last_updated": _now()},
            {"id": "ST-001", "type": "staff", "name": "Dr. Meera Singh", "status": "available", "availability": {"specialty": "Cardiology", "assignedTo": None, "shift": "day"}, "last_updated": _now()},
            {"id": "ST-002", "type": "staff", "name": "Dr. Arjun Nair", "status": "busy", "availability": {"specialty": "General Surgery", "assignedTo": "OT-3", "shift": "night"}, "last_updated": _now()},
            {"id": "ST-003", "type": "staff", "name": "Dr. Priya Menon", "status": "available", "availability": {"specialty": "Anesthesiology", "assignedTo": None, "shift": "day"}, "last_updated": _now()},
            {"id": "ST-004", "type": "staff", "name": "Nurse Rekha Devi", "status": "busy", "availability": {"specialty": "ICU Nursing", "assignedTo": "ICU-A", "shift": "day"}, "last_updated": _now()},
            {"id": "ST-005", "type": "staff", "name": "Nurse Sanjay Patil", "status": "available", "availability": {"specialty": "OT Nursing", "assignedTo": None, "shift": "night"}, "last_updated": _now()},
        ]
        for r in resources_data:
            session.add(Resource(**r))
        session.flush()

        # ─── Schedule Slots ────────────────────────────────────────────
        slots_data = [
            {"ot_id": "OT-1", "slot_date": _days_ago(-2), "slot_time": "09:00", "surgery_id": "SRG-001", "status": "booked", "created_at": _now()},
            {"ot_id": "OT-2", "slot_date": _days_ago(-5), "slot_time": "11:00", "surgery_id": "SRG-002", "status": "booked", "created_at": _now()},
            {"ot_id": "OT-1", "slot_date": _days_ago(-1), "slot_time": "08:00", "surgery_id": "SRG-003", "status": "booked", "created_at": _now()},
            {"ot_id": "OT-3", "slot_date": _days_ago(-1), "slot_time": "14:00", "surgery_id": "SRG-004", "status": "booked", "created_at": _now()},
            {"ot_id": "OT-2", "slot_date": _days_ago(-3), "slot_time": "10:00", "surgery_id": "SRG-005", "status": "booked", "created_at": _now()},
            {"ot_id": "OT-1", "slot_date": _days_ago(-4), "slot_time": "07:30", "surgery_id": "SRG-006", "status": "booked", "created_at": _now()},
            {"ot_id": "OT-3", "slot_date": _days_ago(0), "slot_time": "22:00", "surgery_id": "SRG-007", "status": "in_use", "created_at": _now()},
            {"ot_id": "OT-2", "slot_date": _days_ago(-2), "slot_time": "09:00", "surgery_id": "SRG-008", "status": "booked", "created_at": _now()},
            {"ot_id": "OT-2", "slot_date": _days_ago(-6), "slot_time": "08:00", "surgery_id": "SRG-009", "status": "booked", "created_at": _now()},
            # Open slots
            {"ot_id": "OT-1", "slot_date": _days_ago(-3), "slot_time": "14:00", "surgery_id": None, "status": "available", "created_at": _now()},
            {"ot_id": "OT-1", "slot_date": _days_ago(-5), "slot_time": "14:00", "surgery_id": None, "status": "available", "created_at": _now()},
            {"ot_id": "OT-2", "slot_date": _days_ago(-1), "slot_time": "15:00", "surgery_id": None, "status": "available", "created_at": _now()},
        ]
        for s in slots_data:
            session.add(ScheduleSlot(**s))
        session.flush()

        # ─── Medications ───────────────────────────────────────────────
        meds_data = [
            {"patient_id": "PT-1001", "medication_name": "Amlodipine 5mg", "frequency": "Once daily", "next_dose_at": _hours_from_now(8), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1001", "medication_name": "Metformin 1000mg", "frequency": "Twice daily", "next_dose_at": _hours_from_now(4), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1002", "medication_name": "Salbutamol Inhaler", "frequency": "As needed (PRN)", "next_dose_at": None, "status": "active", "created_at": _now()},
            {"patient_id": "PT-1003", "medication_name": "Tiotropium Inhaler", "frequency": "Once daily", "next_dose_at": _hours_from_now(12), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1003", "medication_name": "Prednisolone 20mg", "frequency": "Once daily (tapering)", "next_dose_at": _hours_from_now(6), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1004", "medication_name": "Erythropoietin 4000 IU", "frequency": "Twice weekly", "next_dose_at": _hours_from_now(48), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1004", "medication_name": "Amlodipine 10mg", "frequency": "Once daily", "next_dose_at": _hours_from_now(8), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1006", "medication_name": "Aspirin 150mg", "frequency": "Once daily", "next_dose_at": _hours_from_now(8), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1006", "medication_name": "Ticagrelor 90mg", "frequency": "Twice daily", "next_dose_at": _hours_from_now(4), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1006", "medication_name": "Heparin Infusion", "frequency": "Continuous IV", "next_dose_at": None, "status": "active", "created_at": _now()},
            {"patient_id": "PT-1009", "medication_name": "Warfarin 5mg", "frequency": "Once daily at night", "next_dose_at": _hours_from_now(10), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1010", "medication_name": "Insulin Glargine 10 units", "frequency": "Once daily pre-dinner", "next_dose_at": _hours_from_now(6), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1005", "medication_name": "Paracetamol 650mg", "frequency": "Every 6 hours (PRN)", "next_dose_at": _hours_from_now(2), "status": "active", "created_at": _now()},
            {"patient_id": "PT-1005", "medication_name": "Enoxaparin 40mg", "frequency": "Once daily SC", "next_dose_at": _hours_from_now(14), "status": "active", "created_at": _now()},
        ]
        for m in meds_data:
            session.add(Medication(**m))
        session.flush()

        # ─── Reminders ─────────────────────────────────────────────────
        med_rows = session.execute(select(Medication.id, Medication.patient_id, Medication.medication_name)).all()
        med_map = {(p, n): i for i, p, n in med_rows}
        reminders_data = [
            {"patient_id": "PT-1001", "medication_id": med_map.get(("PT-1001", "Amlodipine 5mg")), "reminder_at": _hours_from_now(8), "sent_at": None, "created_at": _now()},
            {"patient_id": "PT-1001", "medication_id": med_map.get(("PT-1001", "Metformin 1000mg")), "reminder_at": _hours_from_now(4), "sent_at": None, "created_at": _now()},
            {"patient_id": "PT-1003", "medication_id": med_map.get(("PT-1003", "Prednisolone 20mg")), "reminder_at": _hours_from_now(6), "sent_at": None, "created_at": _now()},
            {"patient_id": "PT-1006", "medication_id": med_map.get(("PT-1006", "Aspirin 150mg")), "reminder_at": _hours_from_now(8), "sent_at": _now(), "created_at": _now()},
            {"patient_id": "PT-1009", "medication_id": med_map.get(("PT-1009", "Warfarin 5mg")), "reminder_at": _hours_from_now(10), "sent_at": None, "created_at": _now()},
            {"patient_id": "PT-1010", "medication_id": med_map.get(("PT-1010", "Insulin Glargine 10 units")), "reminder_at": _hours_from_now(6), "sent_at": None, "created_at": _now()},
        ]
        for r in reminders_data:
            session.add(Reminder(**r))
        session.flush()

        # ─── Consents ──────────────────────────────────────────────────
        consents_data = [
            {"patient_id": "PT-1001", "consent_type": "data_sharing", "purpose": "Share medical data with referring hospital", "granted_at": _now(), "revoked_at": None, "created_at": _now()},
            {"patient_id": "PT-1001", "consent_type": "ai_processing", "purpose": "AI-assisted clinical decision support", "granted_at": _now(), "revoked_at": None, "created_at": _now()},
            {"patient_id": "PT-1004", "consent_type": "abdm_link", "purpose": "Link ABHA ID with hospital records", "granted_at": _now(), "revoked_at": None, "created_at": _now()},
            {"patient_id": "PT-1006", "consent_type": "data_sharing", "purpose": "Emergency data sharing with cardiology team", "granted_at": _now(), "revoked_at": None, "created_at": _now()},
            {"patient_id": "PT-1013", "consent_type": "ai_processing", "purpose": "AI-assisted treatment planning for oncology", "granted_at": _now(), "revoked_at": None, "created_at": _now()},
        ]
        for c in consents_data:
            session.add(Consent(**c))
        session.flush()

        # ─── Audit Log ─────────────────────────────────────────────────
        audit_data = [
            {"user_id": "DOC-001", "user_email": "rajesh.kumar.doc@cdss.ai", "action": "GET /api/v1/patients", "resource": "/api/v1/patients", "timestamp": _now()},
            {"user_id": "DOC-001", "user_email": "rajesh.kumar.doc@cdss.ai", "action": "GET /api/v1/patients/PT-1001", "resource": "/api/v1/patients/PT-1001", "timestamp": _now()},
            {"user_id": "DOC-006", "user_email": "surgeon@cdss.ai", "action": "POST /api/v1/surgeries", "resource": "/api/v1/surgeries/SRG-007", "timestamp": _now()},
            {"user_id": "admin-1", "user_email": "admin@cdss.ai", "action": "GET /api/v1/admin/audit", "resource": "/api/v1/admin/audit", "timestamp": _now()},
            {"user_id": "DOC-005", "user_email": "cardiologist@cdss.ai", "action": "GET /api/v1/patients/PT-1006", "resource": "/api/v1/patients/PT-1006", "timestamp": _now()},
            {"user_id": "NURSE-001", "user_email": "nurse.rekha@cdss.ai", "action": "POST /api/v1/vitals", "resource": "/api/v1/patients/PT-1006/vitals", "timestamp": _now()},
        ]
        for a in audit_data:
            session.add(AuditLog(**a))

    print(
        "Seed complete: "
        "7 hospitals, 15 patients, 13 visits, 10 surgeries, "
        "16 resources, 12 schedule slots, 14 medications, "
        "6 reminders, 5 consents, 6 audit entries."
    )
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed CDSS RDS with sample data")
    parser.add_argument("--force", action="store_true", help="Clear existing seed data and re-insert")
    args = parser.parse_args()
    # #region agent log
    _seed_file = __import__("os").path.abspath(__file__)
    _repo_root = __import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.dirname(__import__("os").path.dirname(_seed_file))))
    _log_path = __import__("os").path.join(_repo_root, "debug-4da93a.log")
    def _dlog(msg, data, hypothesis_id):
        try:
            import time as _t
            with open(_log_path, "a", encoding="utf-8") as _f:
                _f.write(__import__("json").dumps({"sessionId": "4da93a", "timestamp": int(_t.time() * 1000), "location": "seed.main", "message": msg, "data": data, "hypothesisId": hypothesis_id}) + "\n")
        except Exception:
            pass
    # #endregion
    try:
        return run_seed(force=args.force)
    except RuntimeError as e:
        # #region agent log
        _dlog("seed_exception", {"error_type": "RuntimeError", "error_msg": str(e)[:500]}, "H1")
        # #endregion
        print("Error:", e, file=sys.stderr)
        return 1
    except Exception as e:
        # #region agent log
        _dlog("seed_exception", {"error_type": type(e).__name__, "error_msg": str(e)[:500]}, "H3")
        # #endregion
        print("Seed failed:", e, file=sys.stderr)
        err_msg = str(e).lower()
        if "operationalerror" in type(e).__name__.lower() or "psycopg2" in str(type(e)).lower():
            if "connection refused" in err_msg or "10061" in err_msg:
                print("\n  Fix: Port 5433 is not accepting connections. Start the SSM tunnel in another terminal first:", file=sys.stderr)
                print("       .\\scripts\\start_ssm_tunnel.ps1", file=sys.stderr)
                print("       Then run seed again in this terminal.", file=sys.stderr)
            if "password authentication failed" in err_msg:
                print("\n  Fix: Password was rejected. Use the Aurora master password in DATABASE_URL (same as Terraform db_password when the cluster was created).", file=sys.stderr)
                print("       If unsure, check infrastructure/terraform.tfvars or the secret used at apply time.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())


# ---------------------------------------------------------------------------
# Canonical seed implementation (override any duplicated content above).
# ---------------------------------------------------------------------------

def _canonical_run_seed(force: bool = False) -> dict:
    from datetime import date, datetime, timezone

    from sqlalchemy import select

    from cdss.db.models import Patient, Resource
    from cdss.db.session import get_session, init_db

    init_db()
    seeded = {"patients": 0, "resources": 0}
    with get_session() as session:
        has_patients = session.scalar(select(Patient.id).limit(1)) is not None
        has_resources = session.scalar(select(Resource.id).limit(1)) is not None

        if force or not has_patients:
            now = datetime.now(timezone.utc)
            demo_patients = [
                Patient(
                    id="PT-1001",
                    name="Rajesh Kumar",
                    date_of_birth=date(1980, 5, 2),
                    gender="male",
                    language="en",
                    conditions=["Hypertension"],
                    vitals={"hr": 78, "bp": "130/85", "spo2": 97},
                    severity="MODERATE",
                    status="Stable",
                    created_at=now,
                    updated_at=now,
                ),
                Patient(
                    id="PT-1002",
                    name="Ananya Singh",
                    date_of_birth=date(1992, 8, 17),
                    gender="female",
                    language="en",
                    conditions=["Diabetes"],
                    vitals={"hr": 72, "bp": "120/80", "spo2": 99},
                    severity="LOW",
                    status="Ready for Discharge",
                    created_at=now,
                    updated_at=now,
                ),
            ]
            for p in demo_patients:
                session.merge(p)
            seeded["patients"] = len(demo_patients)

        if force or not has_resources:
            demo_resources = [
                Resource(id="OT-1", type="ot", name="OT 1", status="available", availability={"area": "Main", "floor": "2"}),
                Resource(id="EQ-1", type="equipment", name="Ventilator", status="available", availability={"location": "ICU"}),
                Resource(id="DR-100", type="staff", name="Dr. Priya Sharma", status="available", availability={"specialty": "General Medicine"}),
            ]
            for r in demo_resources:
                session.merge(r)
            seeded["resources"] = len(demo_resources)

    return {"ok": True, "seeded": seeded}


run_seed = _canonical_run_seed  # type: ignore[assignment]
