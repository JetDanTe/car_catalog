from datetime import datetime
from typing import Annotated
import re
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class CarBase(BaseModel):
    """Base Pydantic model containing common fields for a Car."""

    brand: Annotated[str, Field(min_length=1, max_length=100, examples=["Toyota"])]
    model: Annotated[str, Field(min_length=1, max_length=100, examples=["Camry"])]
    dealer_or_manufacturer: Annotated[str, Field(min_length=1, max_length=150, examples=["Official Toyota Kyiv"])]
    vin: Annotated[str, Field(min_length=17, max_length=17, examples=["1HGCR2F83HA000000"])]
    body_type: Annotated[str, Field(min_length=1, max_length=50, examples=["sedan"])]
    fuel_type: Annotated[str, Field(min_length=1, max_length=50, examples=["petrol"])]
    engine_capacity: Annotated[float | None, Field(default=None, gt=0, le=20.0, examples=[2.5])] = None
    engine_power: Annotated[int | None, Field(default=None, gt=0, le=3000, examples=[203])] = None
    price: Annotated[float, Field(gt=0, examples=[28500.0])]
    rating: Annotated[float | None, Field(default=None, ge=0.0, le=5.0, examples=[4.8])] = None
    is_available: bool = True
    description: Annotated[str | None, Field(default=None, max_length=5000, examples=["Comfortable family sedan with modern safety suite."])] = None
    year: Annotated[int, Field(ge=1886, le=2100, examples=[2023])]
    features: list[str] = Field(default_factory=list, examples=[["leather seats", "lane assist", "apple carplay"]])

    @field_validator("brand", "model", "dealer_or_manufacturer", "body_type", "fuel_type", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("vin")
    @classmethod
    def validate_vin(cls, v: str) -> str:
        cleaned = v.strip().upper()
        if len(cleaned) != 17:
            raise ValueError("VIN must be exactly 17 characters long")
        if not re.match(r"^[A-HJ-NPR-Z0-9]{17}$", cleaned):
            raise ValueError("VIN contains invalid characters (standard VIN excludes letters I, O, Q)")
        return cleaned


class CarCreate(CarBase):
    """Schema for creating a new Car."""
    pass


class CarUpdate(BaseModel):
    """Schema for partially updating an existing Car."""

    brand: Annotated[str | None, Field(default=None, min_length=1, max_length=100)] = None
    model: Annotated[str | None, Field(default=None, min_length=1, max_length=100)] = None
    dealer_or_manufacturer: Annotated[str | None, Field(default=None, min_length=1, max_length=150)] = None
    vin: Annotated[str | None, Field(default=None, min_length=17, max_length=17)] = None
    body_type: Annotated[str | None, Field(default=None, min_length=1, max_length=50)] = None
    fuel_type: Annotated[str | None, Field(default=None, min_length=1, max_length=50)] = None
    engine_capacity: Annotated[float | None, Field(default=None, gt=0, le=20.0)] = None
    engine_power: Annotated[int | None, Field(default=None, gt=0, le=3000)] = None
    price: Annotated[float | None, Field(default=None, gt=0)] = None
    rating: Annotated[float | None, Field(default=None, ge=0.0, le=5.0)] = None
    is_available: bool | None = None
    description: Annotated[str | None, Field(default=None, max_length=5000)] = None
    year: Annotated[int | None, Field(default=None, ge=1886, le=2100)] = None
    features: list[str] | None = None

    @field_validator("brand", "model", "dealer_or_manufacturer", "body_type", "fuel_type", mode="before")
    @classmethod
    def strip_strings(cls, v: str | None) -> str | None:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("vin")
    @classmethod
    def validate_vin(cls, v: str | None) -> str | None:
        if v is None:
            return None
        cleaned = v.strip().upper()
        if len(cleaned) != 17:
            raise ValueError("VIN must be exactly 17 characters long")
        if not re.match(r"^[A-HJ-NPR-Z0-9]{17}$", cleaned):
            raise ValueError("VIN contains invalid characters (standard VIN excludes letters I, O, Q)")
        return cleaned


class CarResponse(CarBase):
    """Schema for serializing a Car response including database generated fields."""

    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedCarsResponse(BaseModel):
    """Schema for paginated list response of cars."""

    items: list[CarResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool
