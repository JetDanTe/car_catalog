from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from car_catalog.models import Car
from car_catalog.schemas import CarCreate, CarUpdate


async def create_car(db: AsyncSession, car_in: CarCreate) -> Car:
    """Create a new car record in the database."""
    car = Car(**car_in.model_dump())
    db.add(car)
    await db.commit()
    await db.refresh(car)
    return car


async def get_car_by_id(db: AsyncSession, car_id: int) -> Car | None:
    """Retrieve a car record by its primary key ID."""
    result = await db.execute(select(Car).where(Car.id == car_id))
    return result.scalar_one_or_none()


async def get_car_by_vin(db: AsyncSession, vin: str) -> Car | None:
    """Retrieve a car record by its unique VIN code."""
    result = await db.execute(select(Car).where(Car.vin == vin.upper()))
    return result.scalar_one_or_none()


async def get_cars(
    db: AsyncSession,
    *,
    brand: str | None = None,
    fuel_type: str | None = None,
    min_year: int | None = None,
    page: int = 1,
    page_size: int = 10,
) -> tuple[list[Car], int]:
    """Retrieve a paginated list of cars filtered by brand, fuel type, and minimum year.

    Returns:
        tuple[list[Car], int]: A tuple containing the list of cars and the total count.
    """
    query = select(Car)
    count_query = select(func.count(Car.id))

    filters = []
    if brand:
        filters.append(Car.brand.ilike(f"%{brand.strip()}%"))
    if fuel_type:
        filters.append(Car.fuel_type.ilike(f"%{fuel_type.strip()}%"))
    if min_year is not None:
        filters.append(Car.year >= min_year)

    if filters:
        query = query.where(*filters)
        count_query = count_query.where(*filters)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * page_size
    query = query.order_by(Car.id.desc()).offset(offset).limit(page_size)

    items_result = await db.execute(query)
    items = list(items_result.scalars().all())

    return items, total


async def update_car(db: AsyncSession, car: Car, car_update: CarUpdate) -> Car:
    """Partially update an existing car record with provided fields."""
    update_data = car_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(car, field, value)

    await db.commit()
    await db.refresh(car)
    return car


async def delete_car(db: AsyncSession, car: Car) -> None:
    """Delete a car record from the database."""
    await db.delete(car)
    await db.commit()
