from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List, Any
from decimal import Decimal


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ExerciseBase(BaseModel):
    name: str
    category: str
    unit: str


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseResponse(ExerciseBase):
    id: int
    is_system: bool
    user_id: Optional[int]

    class Config:
        from_attributes = True


class PlanDayExerciseBase(BaseModel):
    exercise_id: int
    target_sets: Optional[int] = None
    target_reps: Optional[int] = None
    target_km: Optional[Decimal] = None
    target_minutes: Optional[int] = None


class PlanDayExerciseCreate(PlanDayExerciseBase):
    pass


class PlanDayExerciseResponse(PlanDayExerciseBase):
    id: int
    exercise: Optional[ExerciseResponse] = None

    class Config:
        from_attributes = True


class PlanDayBase(BaseModel):
    day_of_week: int
    exercises: List[PlanDayExerciseCreate] = []


class PlanDayCreate(PlanDayBase):
    pass


class PlanDayResponse(PlanDayBase):
    id: int
    exercises: List[PlanDayExerciseResponse] = []

    class Config:
        from_attributes = True


class WeeklyPlanBase(BaseModel):
    name: str
    description: Optional[str] = None


class WeeklyPlanCreate(WeeklyPlanBase):
    plan_days: List[PlanDayCreate] = []


class WeeklyPlanUpdate(WeeklyPlanBase):
    is_active: Optional[bool] = None
    plan_days: Optional[List[PlanDayCreate]] = None


class WeeklyPlanResponse(WeeklyPlanBase):
    id: int
    is_active: bool
    user_id: int
    plan_days: List[PlanDayResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TrainingRecordBase(BaseModel):
    exercise_id: int
    plan_day_exercise_id: Optional[int] = None
    actual_sets: Optional[int] = None
    actual_reps: Optional[int] = None
    actual_km: Optional[Decimal] = None
    actual_minutes: Optional[int] = None
    weight: Optional[Decimal] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    recorded_at: datetime


class TrainingRecordCreate(TrainingRecordBase):
    pass


class TrainingRecordResponse(TrainingRecordBase):
    id: int
    user_id: int
    exercise: Optional[ExerciseResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TrainingDayRecord(BaseModel):
    recorded_at: datetime
    has_training: bool
    records: List[TrainingRecordResponse] = []


class StatsBase(BaseModel):
    pass


class WeeklyStats(StatsBase):
    training_days: int
    total_records: int


class MonthlyStats(StatsBase):
    total_duration_minutes: int
    training_days: int


class DailyFrequencyItem(BaseModel):
    date: str
    has_training: bool


class DailyFrequencyResponse(StatsBase):
    data: List[DailyFrequencyItem]


class CategoryDurationItem(BaseModel):
    category: str
    category_name: str
    duration_minutes: int
    percentage: float


class CategoryDurationResponse(StatsBase):
    data: List[CategoryDurationItem]
    total_duration: int


class DashboardStats(StatsBase):
    weekly_training_days: int
    monthly_total_duration: int
    daily_frequency: DailyFrequencyResponse
    category_duration: CategoryDurationResponse
