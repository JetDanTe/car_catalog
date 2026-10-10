from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from car_catalog.database import Base


def utc_now() -> datetime:
    """Return the current UTC datetime."""
    return datetime.now(timezone.utc)


class Car(Base):
    """SQLAlchemy model representing a Car entity in the catalog."""

    __tablename__ = "cars"

    # Unique vehicle ID (Primary Key)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)

    # Brand and model of the vehicle
    brand: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    model: Mapped[str] = mapped_column(String(100), index=True, nullable=False)

    # Manufacturer or dealer name
    dealer_or_manufacturer: Mapped[str] = mapped_column(String(150), nullable=False)

    # Vehicle Identification Number (VIN)
    vin: Mapped[str] = mapped_column(String(17), unique=True, index=True, nullable=False)

    # Body type (e.g. sedan, suv, hatchback)
    body_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Fuel type (e.g. petrol, diesel, electric, hybrid)
    fuel_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)

    # Engine capacity in liters or engine power in hp
    engine_capacity: Mapped[float | None] = mapped_column(Float, nullable=True)
    engine_power: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Vehicle price
    price: Mapped[float] = mapped_column(Float, nullable=False)

    # Expert or customer rating (optional)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)

    # In stock / availability flag
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Short description of equipment or technical specs
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Production year
    year: Mapped[int] = mapped_column(Integer, index=True, nullable=False)

    # Timestamp when vehicle was added to system
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    # List of options or tags (e.g. "leather", "autopilot")
    features: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<Car(id={self.id}, vin='{self.vin}', brand='{self.brand}', model='{self.model}', year={self.year})>"
