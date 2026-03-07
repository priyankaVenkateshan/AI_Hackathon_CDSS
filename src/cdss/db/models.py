"""
SQLAlchemy models for CDSS (Aurora PostgreSQL).

The models are intentionally minimal and aligned to the handlers currently implemented
under `src/cdss/api/handlers/*`.
"""

from __future__ import annotations

from datetime import datetime, date
from typing import Any

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _utcnow() -> datetime:
    return datetime.utcnow()


# Use portable JSON type for SQLite/local tests; use JSONB on PostgreSQL/Aurora.
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class Base(DeclarativeBase):
    pass


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(128), nullable=False)
    user_email: Mapped[str | None] = mapped_column(String(256), nullable=True)
    action: Mapped[str] = mapped_column(String(512), nullable=False)
    resource: Mapped[str] = mapped_column(String(512), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)
    details: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # PT-1001
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(32), nullable=True)
    language: Mapped[str | None] = mapped_column(String(16), nullable=True)
    abha_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)

    conditions: Mapped[list[str] | None] = mapped_column(JSON_TYPE, nullable=True)
    allergies: Mapped[list[str] | None] = mapped_column(JSON_TYPE, nullable=True)
    vitals: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)

    blood_group: Mapped[str | None] = mapped_column(String(16), nullable=True)
    ward: Mapped[str | None] = mapped_column(String(64), nullable=True)
    severity: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str | None] = mapped_column(String(64), nullable=True)

    surgery_readiness: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    address_json: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    emergency_contact_json: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)

    last_visit: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)

    visits: Mapped[list["Visit"]] = relationship(back_populates="patient", cascade="all,delete-orphan")
    surgeries: Mapped[list["Surgery"]] = relationship(back_populates="patient", cascade="all,delete-orphan")
    medications: Mapped[list["Medication"]] = relationship(back_populates="patient", cascade="all,delete-orphan")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="patient", cascade="all,delete-orphan")


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id: Mapped[str] = mapped_column(String(128), nullable=False)
    visit_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    extracted_entities: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    transcript_s3_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)

    patient: Mapped[Patient] = relationship(back_populates="visits")


class Surgery(Base):
    __tablename__ = "surgeries"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # SRG-1001
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(128), nullable=False)
    surgeon_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    ot_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    scheduled_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="scheduled", nullable=False)
    checklist: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON_TYPE, nullable=True)
    requirements: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)

    patient: Mapped[Patient] = relationship(back_populates="surgeries")


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False)  # ot|equipment|staff
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="available", nullable=False)
    availability: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    last_updated: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)


class ScheduleSlot(Base):
    __tablename__ = "schedule_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ot_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    slot_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    slot_time: Mapped[str | None] = mapped_column(String(32), nullable=True)
    surgery_id: Mapped[str | None] = mapped_column(ForeignKey("surgeries.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="available", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    medication_name: Mapped[str] = mapped_column(String(256), nullable=False)
    frequency: Mapped[str | None] = mapped_column(String(64), nullable=True)
    next_dose_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)

    patient: Mapped[Patient] = relationship(back_populates="medications")


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    medication_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    reminder_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)

    patient: Mapped[Patient] = relationship(back_populates="reminders")


class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    state: Mapped[str | None] = mapped_column(String(128), nullable=True)
    specialties: Mapped[list[str] | None] = mapped_column(JSON_TYPE, nullable=True)
    available_beds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    icu_beds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    available_icu_beds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tier: Mapped[str | None] = mapped_column(String(32), nullable=True)
    emergency_available: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    latitude: Mapped[str | None] = mapped_column(String(32), nullable=True)
    longitude: Mapped[str | None] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active", nullable=False)


class AlertLog(Base):
    """Clinical alert log for Req 9 – notifications and emergency response."""
    __tablename__ = "alert_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    alert_id: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)  # critical, high, medium, low
    alert_type: Mapped[str] = mapped_column(String(64), nullable=False)  # drug_interaction, critical_vitals, etc.
    channel: Mapped[str] = mapped_column(String(32), nullable=False)  # doctor, pharmacist, emergency
    patient_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    doctor_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)


class AgentEventLog(Base):
    """Inter-agent event log for Req 8 audit – MCP communication events."""
    __tablename__ = "agent_event_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    correlation_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_agent: Mapped[str] = mapped_column(String(64), nullable=False)
    target_agent: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    context: Mapped[dict[str, Any] | None] = mapped_column(JSON_TYPE, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), default=_utcnow, nullable=False)