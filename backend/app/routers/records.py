from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import Annotated, List, Optional
from datetime import datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta

from ..database import get_db
from ..models import User, TrainingRecord, Exercise
from ..schemas import (
    TrainingRecordCreate, TrainingRecordResponse, ExerciseResponse, TrainingDayRecord
)
from ..auth import get_current_user
from ..redis_client import redis_client

router = APIRouter(prefix="/records", tags=["训练记录"])


def record_to_response(record: TrainingRecord) -> TrainingRecordResponse:
    return TrainingRecordResponse(
        id=record.id,
        user_id=record.user_id,
        exercise_id=record.exercise_id,
        plan_day_exercise_id=record.plan_day_exercise_id,
        actual_sets=record.actual_sets,
        actual_reps=record.actual_reps,
        actual_km=record.actual_km,
        actual_minutes=record.actual_minutes,
        weight=record.weight,
        duration_minutes=record.duration_minutes,
        notes=record.notes,
        recorded_at=record.recorded_at,
        created_at=record.created_at,
        exercise=ExerciseResponse.model_validate(record.exercise) if record.exercise else None
    )


async def invalidate_stats_cache(user_id: int):
    await redis_client.delete_pattern(f"stats:{user_id}:*")


@router.get("/", response_model=List[TrainingRecordResponse])
async def get_records(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = select(TrainingRecord).where(TrainingRecord.user_id == current_user.id)
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
        query = query.where(TrainingRecord.recorded_at >= start_dt)
    if end_date:
        end_dt = datetime.fromisoformat(end_date).replace(tzinfo=timezone.utc)
        end_dt = end_dt + timedelta(days=1)
        query = query.where(TrainingRecord.recorded_at < end_dt)
    
    result = await db.execute(
        query.options(selectinload(TrainingRecord.exercise))
        .order_by(TrainingRecord.recorded_at.desc())
    )
    records = result.scalars().all()
    return [record_to_response(r) for r in records]


@router.get("/days/{date_str}", response_model=TrainingDayRecord)
async def get_records_by_date(
    date_str: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    try:
        target_date = datetime.fromisoformat(date_str).replace(
            hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
        )
        next_date = target_date + timedelta(days=1)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="日期格式错误，请使用 YYYY-MM-DD"
        )
    
    result = await db.execute(
        select(TrainingRecord)
        .where(
            TrainingRecord.user_id == current_user.id,
            TrainingRecord.recorded_at >= target_date,
            TrainingRecord.recorded_at < next_date
        )
        .options(selectinload(TrainingRecord.exercise))
        .order_by(TrainingRecord.recorded_at)
    )
    records = result.scalars().all()
    
    return TrainingDayRecord(
        recorded_at=target_date,
        has_training=len(records) > 0,
        records=[record_to_response(r) for r in records]
    )


@router.post("/", response_model=TrainingRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    record_data: TrainingRecordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    new_record = TrainingRecord(
        user_id=current_user.id,
        exercise_id=record_data.exercise_id,
        plan_day_exercise_id=record_data.plan_day_exercise_id,
        actual_sets=record_data.actual_sets,
        actual_reps=record_data.actual_reps,
        actual_km=record_data.actual_km,
        actual_minutes=record_data.actual_minutes,
        weight=record_data.weight,
        duration_minutes=record_data.duration_minutes,
        notes=record_data.notes,
        recorded_at=record_data.recorded_at
    )
    db.add(new_record)
    await db.commit()
    
    result = await db.execute(
        select(TrainingRecord)
        .where(TrainingRecord.id == new_record.id)
        .options(selectinload(TrainingRecord.exercise))
    )
    record = result.scalar_one()
    
    await invalidate_stats_cache(current_user.id)
    
    return record_to_response(record)


@router.get("/{record_id}", response_model=TrainingRecordResponse)
async def get_record(
    record_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(TrainingRecord)
        .where(
            TrainingRecord.id == record_id,
            TrainingRecord.user_id == current_user.id
        )
        .options(selectinload(TrainingRecord.exercise))
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="训练记录不存在"
        )
    return record_to_response(record)


@router.put("/{record_id}", response_model=TrainingRecordResponse)
async def update_record(
    record_id: int,
    record_data: TrainingRecordCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(TrainingRecord)
        .where(
            TrainingRecord.id == record_id,
            TrainingRecord.user_id == current_user.id
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="训练记录不存在"
        )
    
    for key, value in record_data.model_dump().items():
        if hasattr(record, key) and key != "created_at":
            setattr(record, key, value)
    
    await db.commit()
    
    result = await db.execute(
        select(TrainingRecord)
        .where(TrainingRecord.id == record_id)
        .options(selectinload(TrainingRecord.exercise))
    )
    updated_record = result.scalar_one()
    
    await invalidate_stats_cache(current_user.id)
    
    return record_to_response(updated_record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(TrainingRecord)
        .where(
            TrainingRecord.id == record_id,
            TrainingRecord.user_id == current_user.id
        )
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="训练记录不存在"
        )
    
    await db.delete(record)
    await db.commit()
    
    await invalidate_stats_cache(current_user.id)
