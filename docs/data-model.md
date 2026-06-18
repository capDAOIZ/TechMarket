# Modelo de datos

| Tabla | Propósito | Restricción principal |
|---|---|---|
| `sources` | Fuente, atribución y URL pública | `name` único |
| `pipeline_runs` | Estado y contadores de cada ejecución | estado cerrado |
| `pipeline_source_runs` | Resultado y error aislado por conector | ejecución + fuente único |
| `raw_jobs_index` | Puntero al raw y hash de contenido | fuente + external ID + hash |
| `jobs` | Oferta normalizada, sin raw JSON | fuente + external ID único |
| `companies` | Empresa canónica | nombre normalizado único |
| `locations` | Ubicación y país nullable | nombre + país único |
| `technologies` | Catálogo tecnológico | nombre único |
| `job_technologies` | Relación N:M | clave compuesta |
| `weekly_technology_stats` | Serie semanal agregada | semana + tecnología único |

Los campos desconocidos son `NULL`, no cadenas vacías ni valores inventados. `source_url` y la
relación a `sources` son obligatorios. Los modelos no almacenan `raw_payload`.

`jobs.first_seen_at` y `jobs.last_seen_at` registran presencia. Una oferta ausente de una captura
completa pasa a `is_active=false` y recibe `closed_at`; si reaparece se reactiva sin perder su
histórico. Las ejecuciones limitadas no caducan ofertas porque no representan un snapshot completo.

## Particiones del data lake

```text
raw/source=remotive/ingestion_date=YYYY-MM-DD/<timestamp>_<uuid>.json
processed/jobs/partition_date=YYYY-MM-DD/pipeline_run=<id>.jsonl
curated/weekly_technology_stats/latest.jsonl
```
