from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Annotated, List

from ..database import get_db
from ..models import User, Exercise
from ..schemas import ExerciseCreate, ExerciseResponse
from ..auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["运动项目"])


@router.get("/", response_model=List[ExerciseResponse])
async def get_exercises(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    category: str | None = None
):
    query = select(Exercise).where(
        or_(Exercise.is_system == True, Exercise.user_id == current_user.id)
    )
    if category:
        query = query.where(Exercise.category == category)
    
    result = await db.execute(query.order_by(Exercise.category, Exercise.name))
    exercises = result.scalars().all()
    return [ExerciseResponse.model_validate(ex) for ex in exercises]


@router.post("/", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def create_exercise(
    exercise_data: ExerciseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    new_exercise = Exercise(
        name=exercise_data.name,
        category=exercise_data.category,
        unit=exercise_data.unit,
        is_system=False,
        user_id=current_user.id
    )
    db.add(new_exercise)
    await db.commit()
    await db.refresh(new_exercise)
    return ExerciseResponse.model_validate(new_exercise)


@router.get("/{exercise_id}", response_model=ExerciseResponse)
async def get_exercise(
    exercise_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            or_(Exercise.is_system == True, Exercise.user_id == current_user.id)
        )
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="运动项目不存在"
        )
    return ExerciseResponse.model_validate(exercise)


@router.put("/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(
    exercise_id: int,
    exercise_data: ExerciseCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id
        )
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="运动项目不存在或无权修改"
        )
    
    exercise.name = exercise_data.name
    exercise.category = exercise_data.category
    exercise.unit = exercise_data.unit
    
    await db.commit()
    await db.refresh(exercise)
    return ExerciseResponse.model_validate(exercise)


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(Exercise).where(
            Exercise.id == exercise_id,
            Exercise.user_id == current_user.id
        )
    )
    exercise = result.scalar_one_or_none()
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="运动项目不存在或无权删除"
        )
    
    await db.delete(exercise)
    await db.commit()
