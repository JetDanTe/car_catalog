import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from car_catalog import crud
from car_catalog.database import get_db
from car_catalog.schemas import (
    CarCreate,
    CarResponse,
    CarUpdate,
    PaginatedCarsResponse,
)

router = APIRouter(prefix="/cars", tags=["cars"])


@router.post(
    "/",
    response_model=CarResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new car",
    description="Adds a new car to the catalog. Verifies VIN code uniqueness.",
)
async def create_car_endpoint(
    car_in: CarCreate,
    db: AsyncSession = Depends(get_db),
) -> CarResponse:
    existing_car = await crud.get_car_by_vin(db, car_in.vin)
    if existing_car:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Car with VIN '{car_in.vin}' already exists in catalog",
        )
    return await crud.create_car(db, car_in)


@router.get(
    "/",
    response_model=PaginatedCarsResponse,
    status_code=status.HTTP_200_OK,
    summary="List cars",
    description="Returns a paginated list of cars with optional filters for brand, fuel type, and minimum production year.",
)
async def list_cars_endpoint(
    brand: str | None = Query(
        default=None,
        description="Filter by car brand (case-insensitive substring match)",
        examples=["Toyota"],
    ),
    fuel_type: str | None = Query(
        default=None,
        description="Filter by fuel type (e.g. petrol, diesel, electric, hybrid)",
        examples=["petrol"],
    ),
    min_year: int | None = Query(
        default=None,
        ge=1886,
        le=2100,
        description="Filter by minimum production year",
        examples=[2020],
    ),
    page: int = Query(
        default=1,
        ge=1,
        description="Page number (1-based index)",
    ),
    page_size: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Number of items per page (1 to 100)",
    ),
    db: AsyncSession = Depends(get_db),
) -> PaginatedCarsResponse:
    items, total = await crud.get_cars(
        db,
        brand=brand,
        fuel_type=fuel_type,
        min_year=min_year,
        page=page,
        page_size=page_size,
    )
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedCarsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1 and total > 0,
    )


@router.get(
    "/{car_id}",
    response_model=CarResponse,
    status_code=status.HTTP_200_OK,
    summary="Get single car by ID",
    description="Retrieves full details of a vehicle by its unique identifier.",
)
async def get_car_endpoint(
    car_id: int,
    db: AsyncSession = Depends(get_db),
) -> CarResponse:
    car = await crud.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Car with ID {car_id} not found",
        )
    return car


@router.patch(
    "/{car_id}",
    response_model=CarResponse,
    status_code=status.HTTP_200_OK,
    summary="Partially update a car",
    description="Updates only the provided fields of the specified car by its ID.",
)
async def update_car_endpoint(
    car_id: int,
    car_update: CarUpdate,
    db: AsyncSession = Depends(get_db),
) -> CarResponse:
    car = await crud.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Car with ID {car_id} not found",
        )

    if car_update.vin is not None and car_update.vin.upper() != car.vin:
        existing_vin_car = await crud.get_car_by_vin(db, car_update.vin)
        if existing_vin_car and existing_vin_car.id != car_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Car with VIN '{car_update.vin}' already exists in catalog",
            )

    return await crud.update_car(db, car, car_update)


@router.delete(
    "/{car_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a car",
    description="Removes a vehicle from the catalog by its ID.",
)
async def delete_car_endpoint(
    car_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    car = await crud.get_car_by_id(db, car_id)
    if not car:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Car with ID {car_id} not found",
        )
    await crud.delete_car(db, car)
