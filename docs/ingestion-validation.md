# Validación de ingesta real

Fecha: 2026-06-18. Entorno: Docker local, PostgreSQL 16 y APIs públicas reales.

## Ejecución limitada repetida

Comando:

```bash
python data-platform/scripts/run_pipeline.py --sources arbeitnow remotive greenhouse --limit 50
```

Dos ejecuciones consecutivas descargaron 132 registros por ejecución: Arbeitnow 50, Remotive 32 y
Greenhouse 50. Cada ejecución cargó 31 ofertas y descartó 101 (76,5%). El total de `jobs` permaneció
en 38, confirmando el upsert idempotente.

## Snapshot completo de Greenhouse

Se validaron respuestas HTTP 200 para Stripe, Databricks, Anthropic, GitLab y Figma. El snapshot
descargó 1.949 registros, cargó 916 ofertas tecnológicas y descartó 1.033 (53,0%). Distribución
activa: Anthropic, Databricks, Figma, GitLab y Stripe.

## Estado final auditado

- 947 ofertas activas: Arbeitnow 12, Remotive 19 y Greenhouse 916.
- 8 ofertas cerradas conservadas para histórico.
- 0 duplicados de la clave `(source_id, external_id)`.
- 0 modalidades nulas en las ofertas activas.
- Roles nulos: Arbeitnow 4, Remotive 0 y Greenhouse 29.
- Seniority nulo cuando no está expresado en el título: 240 registros activos.
- Salario nulo: Arbeitnow 11, Remotive 3 y Greenhouse 916.

Greenhouse no proporciona un campo salarial estructurado en estas respuestas. Conforme al contrato,
no se extraen números desde el HTML de la descripción. Los nulos salariales son ausencia de dato, no
un fallo del parser.

Los directorios raw, processed y curated contienen archivos de las ejecuciones. `raw_jobs_index`
deduplica hashes de contenido, mientras raw mantiene capturas inmutables con nombres únicos.

