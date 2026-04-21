from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_
from sqlalchemy.orm import selectinload
from typing import Annotated, List

from ..database import get_db
from ..models import User, WeeklyPlan, PlanDay, PlanDayExercise, Exercise
from ..schemas import (
    WeeklyPlanCreate, WeeklyPlanUpdate, WeeklyPlanResponse,
    PlanDayResponse, PlanDayExerciseResponse, ExerciseResponse
)
from ..auth import get_current_user

router = APIRouter(prefix="/plans", tags=["训练计划"])


def plan_to_response(plan: WeeklyPlan) -> WeeklyPlanResponse:
    plan_days = []
    for day in plan.plan_days:
        day_exercises = []
        for ex in day.exercises:
            day_exercises.append(PlanDayExerciseResponse(
                id=ex.id,
                exercise_id=ex.exercise_id,
                target_sets=ex.target_sets,
                target_reps=ex.target_reps,
                target_km=ex.target_km,
                target_minutes=ex.target_minutes,
                exercise=ExerciseResponse.model_validate(ex.exercise) if ex.exercise else None
            ))
        plan_days.append(PlanDayResponse(
            id=day.id,
            day_of_week=day.day_of_week,
            exercises=day_exercises
        ))
    
    return WeeklyPlanResponse(
        id=plan.id,
        name=plan.name,
        description=plan.description,
        is_active=plan.is_active,
        user_id=plan.user_id,
        plan_days=plan_days,
        created_at=plan.created_at,
        updated_at=plan.updated_at
    )


@router.get("/", response_model=List[WeeklyPlanResponse])
async def get_plans(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(WeeklyPlan)
        .where(WeeklyPlan.user_id == current_user.id)
        .options(
            selectinload(WeeklyPlan.plan_days)
            .selectinload(PlanDay.exercises)
            .selectinload(PlanDayExercise.exercise)
        )
        .order_by(WeeklyPlan.created_at.desc())
    )
    plans = result.scalars().unique().all()
    return [plan_to_response(p) for p in plans]


@router.post("/", response_model=WeeklyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    plan_data: WeeklyPlanCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    new_plan = WeeklyPlan(
        name=plan_data.name,
        description=plan_data.description,
        user_id=current_user.id
    )
    db.add(new_plan)
    await db.flush()

    for day_data in plan_data.plan_days:
        plan_day = PlanDay(
            plan_id=new_plan.id,
            day_of_week=day_data.day_of_week
        )
        db.add(plan_day)
        await db.flush()

        for ex_data in day_data.exercises:
            plan_day_ex = PlanDayExercise(
                plan_day_id=plan_day.id,
                exercise_id=ex_data.exercise_id,
                target_sets=ex_data.target_sets,
                target_reps=ex_data.target_reps,
                target_km=ex_data.target_km,
                target_minutes=ex_data.target_minutes
            )
            db.add(plan_day_ex)

    await db.commit()

    result = await db.execute(
        select(WeeklyPlan)
        .where(WeeklyPlan.id == new_plan.id)
        .options(
            selectinload(WeeklyPlan.plan_days)
            .selectinload(PlanDay.exercises)
            .selectinload(PlanDayExercise.exercise)
        )
    )
    plan = result.scalar_one()
    return plan_to_response(plan)


@router.get("/{plan_id}", response_model=WeeklyPlanResponse)
async def get_plan(
    plan_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(WeeklyPlan)
        .where(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == current_user.id)
        .options(
            selectinload(WeeklyPlan.plan_days)
            .selectinload(PlanDay.exercises)
            .selectinload(PlanDayExercise.exercise)
        )
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="训练计划不存在"
        )
    return plan_to_response(plan)


@router.put("/{plan_id}", response_model=WeeklyPlanResponse)
async def update_plan(
    plan_id: int,
    plan_data: WeeklyPlanUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(WeeklyPlan)
        .where(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == current_user.id)
        .options(selectinload(WeeklyPlan.plan_days).selectinload(PlanDay.exercises))
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="训练计划不存在"
        )

    if plan_data.name is not None:
        plan.name = plan_data.name
    if plan_data.description is not None:
        plan.description = plan_data.description
    if plan_data.is_active is not None:
        plan.is_active = plan_data.is_active

    if plan_data.plan_days is not None:
        await db.execute(
            delete(PlanDayExercise).where(
                PlanDayExercise.plan_day_id.in_(
                    select(PlanDay.id).where(PlanDay.plan_id == plan.id)
                )
            )
        )
        await db.execute(delete(PlanDay).where(PlanDay.plan_id == plan.id))
        await db.flush()

        for day_data in plan_data.plan_days:
            plan_day = PlanDay(plan_id=plan.id, day_of_week=day_data.day_of_week)
            db.add(plan_day)
            await db.flush()

            for ex_data in day_data.exercises:
                plan_day_ex = PlanDayExercise(
                    plan_day_id=plan_day.id,
                    exercise_id=ex_data.exercise_id,
                    target_sets=ex_data.target_sets,
                    target_reps=ex_data.target_reps,
                    target_km=ex_data.target_km,
                    target_minutes=ex_data.target_minutes
                )
                db.add(plan_day_ex)

    await db.commit()

    result = await db.execute(
        select(WeeklyPlan)
        .where(WeeklyPlan.id == plan.id)
        .options(
            selectinload(WeeklyPlan.plan_days)
            .selectinload(PlanDay.exercises)
            .selectinload(PlanDayExercise.exercise)
        )
    )
    updated_plan = result.scalar_one()
    return plan_to_response(updated_plan)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    result = await db.execute(
        select(WeeklyPlan).where(WeeklyPlan.id == plan_id, WeeklyPlan.user_id == current_user.id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="训练计划不存在"
        )
    
    await db.delete(plan)
    await db.commit()
