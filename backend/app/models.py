from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Numeric, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    exercises = relationship("Exercise", back_populates="user")
    weekly_plans = relationship("WeeklyPlan", back_populates="user")
    training_records = relationship("TrainingRecord", back_populates="user")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(20), nullable=False)  # cardio, strength, flexibility
    unit = Column(String(20), nullable=False)  # km, reps, sets_reps, minutes
    is_system = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="exercises")
    plan_day_exercises = relationship("PlanDayExercise", back_populates="exercise")
    training_records = relationship("TrainingRecord", back_populates="exercise")


class WeeklyPlan(Base):
    __tablename__ = "weekly_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="weekly_plans")
    plan_days = relationship("PlanDay", back_populates="plan", cascade="all, delete-orphan")


class PlanDay(Base):
    __tablename__ = "plan_days"
    __table_args__ = (UniqueConstraint('plan_id', 'day_of_week'),)

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("weekly_plans.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0: Monday, 1: Tuesday, ..., 6: Sunday
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    plan = relationship("WeeklyPlan", back_populates="plan_days")
    exercises = relationship("PlanDayExercise", back_populates="plan_day", cascade="all, delete-orphan")


class PlanDayExercise(Base):
    __tablename__ = "plan_day_exercises"

    id = Column(Integer, primary_key=True, index=True)
    plan_day_id = Column(Integer, ForeignKey("plan_days.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    target_sets = Column(Integer, nullable=True)
    target_reps = Column(Integer, nullable=True)
    target_km = Column(Numeric(10, 2), nullable=True)
    target_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    plan_day = relationship("PlanDay", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="plan_day_exercises")
    training_records = relationship("TrainingRecord", back_populates="plan_day_exercise")


class TrainingRecord(Base):
    __tablename__ = "training_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_day_exercise_id = Column(Integer, ForeignKey("plan_day_exercises.id"), nullable=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    actual_sets = Column(Integer, nullable=True)
    actual_reps = Column(Integer, nullable=True)
    actual_km = Column(Numeric(10, 2), nullable=True)
    actual_minutes = Column(Integer, nullable=True)
    weight = Column(Numeric(5, 2), nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="training_records")
    plan_day_exercise = relationship("PlanDayExercise", back_populates="training_records")
    exercise = relationship("Exercise", back_populates="training_records")
