# Entrega para frontend

Swagger local: <http://localhost:8000/docs>

## Decisión de contrato v1

La API v1 usa objetos planos y nombres `snake_case`. No se ofrecen simultáneamente variantes
anidadas o `camelCase`, porque duplicarían el contrato y crearían ambigüedad. Swagger/OpenAPI es la
fuente ejecutable de verdad y este documento registra las decisiones humanas. Frontend puede:

- generar tipos desde <http://localhost:8000/openapi.json>; o
- usar como referencia el archivo versionado `docs/frontend-types.ts`.

La conversión opcional a `camelCase` pertenece al adaptador HTTP del frontend, no al backend.

CORS admite por defecto `http://localhost:5173` y `http://localhost:3000`. Se puede cambiar con
`CORS_ORIGINS`, usando URLs separadas por coma.

## Tipos cerrados

- `role`: `backend | frontend | fullstack | data | devops | mobile | qa | security |
  machine_learning | management | software | null`
- `seniority`: `intern | junior | senior | lead | manager | null`
- `modality`: `remote | hybrid | onsite | null`
- `sort`: `newest | oldest | quality`
- `pipeline status`: `running | success | partial_success | failed`

El resto de nullables está publicado en OpenAPI. Las fechas son ISO 8601 y todos los listados de
ofertas incluyen `source_name`, `source_url` y `attribution`.

## Endpoints

- `GET /jobs` y `GET /jobs/{id}`
- `GET /stats/summary`
- `GET /stats/technologies`
- `GET /stats/roles`
- `GET /stats/seniority`
- `GET /stats/modalities`
- `GET /trends/technologies`
- `GET /pipeline-runs`
- `GET /sources`

Filtros de `/jobs`: `q`, `technology`, `role`, `seniority`, `modality`, `remote`, `source`, `active`,
`page`, `page_size` y `sort`. `active=true` es el valor predeterminado; use `active=false` para
consultar ofertas caducadas.

## Ejemplo real del seed: `GET /jobs?page=1&page_size=1`

```json
{
  "items": [
    {
      "id": 1,
      "title": "Backend Python Engineer",
      "company_name": "Acme Cloud",
      "location": "Madrid, Spain",
      "role": "backend",
      "seniority": null,
      "modality": "onsite",
      "remote": false,
      "technologies": ["AWS", "Docker", "FastAPI", "PostgreSQL", "Python"],
      "published_at": "2026-06-18T10:00:00Z",
      "fetched_at": "2026-06-18T10:00:00Z",
      "salary_min": 55000,
      "salary_max": 70000,
      "salary_currency": "EUR",
      "salary_period": "year",
      "quality_score": 1.0,
      "source_name": "arbeitnow",
      "source_url": "https://example.com/seed-a1",
      "attribution": "Jobs provided by Arbeitnow",
      "first_seen_at": "2026-06-18T10:00:00Z",
      "last_seen_at": "2026-06-18T10:00:00Z",
      "is_active": true,
      "closed_at": null
    }
  ],
  "page": 1,
  "page_size": 1,
  "total": 7,
  "total_pages": 7
}
```

Los timestamps exactos y los IDs dependen del momento y del estado del volumen local.

## Fuentes y atribuciones

| Fuente | Atribución API | Sitio |
|---|---|---|
| Arbeitnow | Jobs provided by Arbeitnow | <https://www.arbeitnow.com/> |
| Remotive | Jobs provided by Remotive | <https://remotive.com/> |
| Greenhouse | Jobs provided by Greenhouse job boards | <https://www.greenhouse.com/> |
| Adzuna | Jobs provided by Adzuna | <https://www.adzuna.es/> |
