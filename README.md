# TechJobs Radar

Backend y plataforma de datos para convertir ofertas de empleo de Arbeitnow, Remotive y
Greenhouse en un catálogo normalizado y estadísticas consumibles por frontend.

## Arranque

Requisitos: Docker Desktop con Docker Compose v2.

```bash
docker compose up --build
```

El contenedor aplica la migración, carga un seed determinista y levanta:

- API: <http://localhost:8000>
- Swagger/OpenAPI: <http://localhost:8000/docs>
- Health: <http://localhost:8000/health>
- Frontend: <http://localhost:5173>

Para detenerlo:

```bash
docker compose down
```

El volumen de PostgreSQL y las capas del data lake se conservan. Use
`docker compose down -v` solo si quiere borrar la base local.

Las migraciones, el seed local y la API son servicios separados. Para arrancar sin seed:

```bash
LOAD_SEED=false docker compose up --build
```

## Pipeline

Con el entorno Python instalado y `DATABASE_URL` apuntando a PostgreSQL:

```bash
python data-platform/scripts/run_pipeline.py --seed
python data-platform/scripts/run_pipeline.py --sources arbeitnow remotive greenhouse --limit 50
```

Reconstrucción de una base vacía desde todos los archivos processed:

```bash
python data-platform/scripts/rebuild_database.py
```

Raw usa archivos únicos y nunca sobrescribe una captura. Processed contiene registros
normalizados suficientes para reconstruir PostgreSQL. Curated se recalcula desde la base.

## Desarrollo

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
pytest -q
ruff check .
```

La arquitectura, el modelo y el contrato para frontend están documentados en `docs/`.

El frontend consume FastAPI por defecto. Para usar mocks explícitamente, configure
`VITE_USE_MOCKS=true` dentro de `apps/web/.env.local`.

## Automatización y producción

- `.github/workflows/ci.yml`: Ruff y Pytest en cada push/PR.
- `.github/workflows/daily-ingestion.yml`: ingesta diaria con `DATABASE_URL` como secret.
- `infra/docker-compose.prod.yml`: API sin seed y migración separada.
- `docs/deployment.md`: variables, almacenamiento, logs y verificaciones.
