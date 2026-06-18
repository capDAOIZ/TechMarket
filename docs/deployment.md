# Preparación de despliegue

## Requisitos

- PostgreSQL gestionado con TLS y backups.
- Dominio HTTPS para API y frontend.
- Almacenamiento persistente para `DATA_LAKE_ROOT` o exportación de artifacts.
- Agregador de logs que capture stdout/stderr del contenedor.

## Variables obligatorias

- `DATABASE_URL`: secreto del PostgreSQL gestionado.
- `CORS_ORIGINS`: dominio HTTPS exacto del frontend.
- `DATA_LAKE_ROOT`: volumen persistente cuando la plataforma lo admita.

No se debe ejecutar el seed en producción. `infra/docker-compose.prod.yml` no incluye seed y separa
la migración del proceso normal de la API. La migración debe terminar correctamente antes de
promover una nueva versión.

## Ingesta diaria

`.github/workflows/daily-ingestion.yml` ejecuta la ingesta a las 04:17 UTC y requiere el secreto
`DATABASE_URL`. Conserva cada data lake como artifact durante 30 días. En una plataforma con cron,
se puede ejecutar el mismo comando contra un volumen persistente.

## Comprobaciones posteriores

1. `GET /health` devuelve `200` desde internet.
2. `GET /sources` muestra las tres fuentes.
3. `GET /pipeline-runs` muestra el detalle por conector.
4. CORS solo permite el dominio publicado del frontend.
5. Logs y alertas de la plataforma capturan estados `failed` y `partial_success`.

