from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct
from typing import Annotated
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta

from ..database import get_db
from ..models import User, TrainingRecord, Exercise
from ..schemas import (
    WeeklyStats, MonthlyStats, DailyFrequencyResponse, DailyFrequencyItem,
    CategoryDurationResponse, CategoryDurationItem, DashboardStats
)
from ..auth import get_current_user
from ..redis_client import redis_client

router = APIRouter(prefix="/stats", tags=["统计"])

CATEGORY_NAMES = {
    "cardio": "有氧",
    "strength": "力量",
    "flexibility": "柔韧"
}


async def get_weekly_stats(db: AsyncSession, user_id: int) -> WeeklyStats:
    cache_key = f"stats:{user_id}:weekly"
    cached = await redis_client.get(cache_key)
    if cached:
        return WeeklyStats(**cached)

    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=7)

    result = await db.execute(
        select(
            func.count(distinct(func.date(TrainingRecord.recorded_at))).label("days"),
            func.count(TrainingRecord.id).label("records")
        )
        .where(
            TrainingRecord.user_id == user_id,
            TrainingRecord.recorded_at >= week_start,
            TrainingRecord.recorded_at < week_end
        )
    )
    row = result.one()
    stats = WeeklyStats(
        training_days=row.days or 0,
        total_records=row.records or 0
    )
    
    await redis_client.set(cache_key, stats.model_dump(), expire=300)
    return stats


async def get_monthly_stats(db: AsyncSession, user_id: int) -> MonthlyStats:
    cache_key = f"stats:{user_id}:monthly"
    cached = await redis_client.get(cache_key)
    if cached:
        return MonthlyStats(**cached)

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month = month_start + relativedelta(months=1)

    result = await db.execute(
        select(
            func.coalesce(func.sum(TrainingRecord.duration_minutes), 0).label("duration"),
            func.count(distinct(func.date(TrainingRecord.recorded_at))).label("days")
        )
        .where(
            TrainingRecord.user_id == user_id,
            TrainingRecord.recorded_at >= month_start,
            TrainingRecord.recorded_at < next_month
        )
    )
    row = result.one()
    stats = MonthlyStats(
        total_duration_minutes=int(row.duration or 0),
        training_days=row.days or 0
    )
    
    await redis_client.set(cache_key, stats.model_dump(), expire=300)
    return stats


async def get_daily_frequency(db: AsyncSession, user_id: int) -> DailyFrequencyResponse:
    cache_key = f"stats:{user_id}:daily_frequency"
    cached = await redis_client.get(cache_key)
    if cached:
        return DailyFrequencyResponse(**cached)

    now = datetime.now(timezone.utc)
    end_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_date = end_date - timedelta(days=29)

    result = await db.execute(
        select(
            func.date(TrainingRecord.recorded_at).label("record_date"),
            func.count(TrainingRecord.id).label("count")
        )
        .where(
            TrainingRecord.user_id == user_id,
            TrainingRecord.recorded_at >= start_date,
            TrainingRecord.recorded_at < end_date + timedelta(days=1)
        )
        .group_by(func.date(TrainingRecord.recorded_at))
        .order_by(func.date(TrainingRecord.recorded_at))
    )
    rows = result.all()
    training_dates = {str(row.record_date): row.count > 0 for row in rows}

    frequency_data = []
    for i in range(30):
        date = start_date + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        frequency_data.append(DailyFrequencyItem(
            date=date_str,
            has_training=training_dates.get(date_str, False)
        ))

    response = DailyFrequencyResponse(data=frequency_data)
    await redis_client.set(cache_key, response.model_dump(), expire=300)
    return response


async def get_category_duration(db: AsyncSession, user_id: int) -> CategoryDurationResponse:
    cache_key = f"stats:{user_id}:category_duration"
    cached = await redis_client.get(cache_key)
    if cached:
        return CategoryDurationResponse(**cached)

    now = datetime.now(timezone.utc)
    end_date = now
    start_date = end_date - timedelta(days=30)

    result = await db.execute(
        select(
            Exercise.category,
            func.coalesce(func.sum(TrainingRecord.duration_minutes), 0).label("duration")
        )
        .join(Exercise, TrainingRecord.exercise_id == Exercise.id)
        .where(
            TrainingRecord.user_id == user_id,
            TrainingRecord.recorded_at >= start_date,
            TrainingRecord.recorded_at <= end_date
        )
        .group_by(Exercise.category)
    )
    rows = result.all()

    category_durations = {}
    total_duration = 0
    for row in rows:
        duration = int(row.duration or 0)
        category_durations[row.category] = duration
        total_duration += duration

    for cat in ["cardio", "strength", "flexibility"]:
        if cat not in category_durations:
            category_durations[cat] = 0

    category_data = []
    for cat in ["cardio", "strength", "flexibility"]:
        duration = category_durations.get(cat, 0)
        percentage = (duration / total_duration * 100) if total_duration > 0 else 0
        category_data.append(CategoryDurationItem(
            category=cat,
            category_name=CATEGORY_NAMES.get(cat, cat),
            duration_minutes=duration,
            percentage=round(percentage, 2)
        ))

    response = CategoryDurationResponse(
        data=category_data,
        total_duration=total_duration
    )
    await redis_client.set(cache_key, response.model_dump(), expire=300)
    return response


@router.get("/weekly", response_model=WeeklyStats)
async def weekly_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    return await get_weekly_stats(db, current_user.id)


@router.get("/monthly", response_model=MonthlyStats)
async def monthly_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    return await get_monthly_stats(db, current_user.id)


@router.get("/daily-frequency", response_model=DailyFrequencyResponse)
async def daily_frequency(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    return await get_daily_frequency(db, current_user.id)


@router.get("/category-duration", response_model=CategoryDurationResponse)
async def category_duration(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    return await get_category_duration(db, current_user.id)


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    weekly = await get_weekly_stats(db, current_user.id)
    monthly = await get_monthly_stats(db, current_user.id)
    daily_freq = await get_daily_frequency(db, current_user.id)
    category_dur = await get_category_duration(db, current_user.id)

    return DashboardStats(
        weekly_training_days=weekly.training_days,
        monthly_total_duration=monthly.total_duration_minutes,
        daily_frequency=daily_freq,
        category_duration=category_dur
    )
