# Car Catalog API

RESTful API service for a car dealership or online vehicle marketplace catalog. Implemented according to the technical requirements in `homework.md`.

---

## 📌 Core technology stack
- **Programming language**: Python 3.12+
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (modern high-performance asynchronous web framework)
- **ORM / Database**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (AsyncIO) + SQLite (`aiosqlite`)
- **Data validation and serialization**: [Pydantic v2](https://docs.pydantic.dev/) & Pydantic Settings
- **Testing**: [Pytest](https://docs.pytest.org/) + `pytest-asyncio` + `httpx` (full coverage of scenarios)
- **Package manager**: `uv`

---

## 📋 Data model: `Car`

According to the technical specification, the entity contains all required fields:

| Field | Type | Description |
|---|---|---|
| `id` | `int` | Unique vehicle ID (Primary Key) |
| `brand` | `str` | Vehicle brand (for example, Toyota, BMW) |
| `model` | `str` | Vehicle model (for example, Camry, X5) |
| `dealer_or_manufacturer` | `str` | Manufacturer or dealer name |
| `vin` | `str` | Unique VIN code (17 characters according to the standard) |
| `body_type` | `str` | Vehicle body type (sedan, crossover, hatchback, etc.) |
| `fuel_type` | `str` | Fuel type (gasoline, diesel, electric, hybrid, etc.) |
| `engine_capacity` | `float | null` | Engine volume in liters (for example, 2.5) |
| `engine_power` | `int | null` | Engine power in hp (for example, 203) |
| `price` | `float` | Vehicle price (> 0) |
| `rating` | `float | null` | Expert or buyer rating (0.0 - 5.0) |
| `is_available` | `bool` | Availability for sale |
| `description` | `str | null` | Short description of the trim or specifications |
| `year` | `int` | Vehicle manufacturing year |
| `created_at` | `datetime` | Date and time when the record was added to the system (UTC) |
| `features` | `list[str]` | List of options or tags (for example, `["leather", "autopilot"]`) |

---

## 🚀 API endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| `POST` | `/cars/` | Create a new car | `201 Created` |
| `GET` | `/cars/` | List cars with filtering and pagination | `200 OK` |
| `GET` | `/cars/{id}` | View one car by ID | `200 OK` |
| `PATCH` | `/cars/{id}` | Partial update of a car | `200 OK` |
| `DELETE` | `/cars/{id}` | Delete a car | `204 No Content` |
| `GET` | `/` | Redirect to the bundled frontend | `302 Found` |
| `GET` | `/health` | Health check and links to documentation | `200 OK` |

### Filters for `GET /cars/`
- `brand`: search by brand substring (case-insensitive, for example, `?brand=toyota`)
- `fuel_type`: filter by fuel type (for example, `?fuel_type=electro` or `?fuel_type=petrol`)
- `min_year`: minimum production year (for example, `?min_year=2021`)
- `page`: page number (default: 1)
- `page_size`: number of records per page (default: 10, max: 100)

The list response returns a pagination object:
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "page_size": 10,
  "total_pages": 5,
  "has_next": true,
  "has_prev": false
}
```

---

## 🛠️ Installation and running

### 1. Install dependencies
```bash
uv sync
```

### 2. Populate the database with test data (Seed)
```bash
uv run python -m car_catalog.seed
```

### 3. Run the web server
```bash
uv run uvicorn car_catalog.main:app --reload
```
Or via the project script:
```bash
uv run car-catalog
```

The API and a convenient web interface will be available at:
- 🌟 **Car catalog web interface**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/) (also available at [http://127.0.0.1:8000/app/](http://127.0.0.1:8000/app/), or open the file `frontend/index.html` in any browser)
- 📖 **Interactive Swagger documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- 📑 **ReDoc documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## ☁️ Deploy on Render

This project can be deployed to Render as a **Python Web Service**.

### Important note about the database

The app uses SQLite by default:

```python
sqlite+aiosqlite:///./cars.db
```

On Render, the application filesystem is ephemeral, so SQLite data would be lost on redeploys unless you attach a **persistent disk**.

Recommended Render database URL:

```text
sqlite+aiosqlite:////var/data/cars.db
```

### Option 1. Blueprint deployment with `render.yaml`

This repository includes a `render.yaml` file. In Render:

1. Push the repository to GitHub.
2. In Render, choose **New +** → **Blueprint**.
3. Select this repository.
4. Review the generated web service and create it.

The blueprint config:
- installs the project in editable mode so the `frontend/` directory is available at runtime;
- starts FastAPI with Uvicorn on Render's assigned port;
- mounts a persistent disk at `/var/data`;
- sets `DATABASE_URL` to the persistent SQLite database path.

> If your Render account does not allow persistent disks on free instances, choose **Starter** or a higher plan for this service.

### Option 2. Manual web service setup

If you prefer to configure the service in the dashboard manually, use these values:

- **Environment**: `Python`
- **Build Command**:

  ```bash
  pip install -e .
  ```

- **Start Command**:

  ```bash
  uvicorn car_catalog.main:app --host 0.0.0.0 --port $PORT
  ```

- **Health Check Path**: `/health`

### Required Render settings

Add a persistent disk:

- **Mount Path**: `/var/data`
- **Size**: `1 GB` or larger

Set these environment variables:

- `PYTHON_VERSION=3.12.7`
- `DATABASE_URL=sqlite+aiosqlite:////var/data/cars.db`

### Seed the database after the first deploy

The application creates tables automatically on startup, but it does **not** insert sample data automatically.

After the first successful deploy:

1. Open the service **Shell** in Render.
2. Run:

```bash
python -m car_catalog.seed
```

Then verify:

- `/` opens the frontend;
- `/health` returns the health payload;
- `/docs` opens Swagger UI;
- `/app/` also serves the frontend;
- `/cars/` returns the seeded catalog.

### Why `pip install -e .` is used

The FastAPI app serves static files from the repository's `frontend/` directory. Installing the project in editable mode keeps the runtime pointed at the checked-out source tree, so `/app/` continues to work correctly on Render.

If you install with `pip install .`, the Python package is copied into the environment and the `frontend/` directory may not be available where the app expects it.

---

