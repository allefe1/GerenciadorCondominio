#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL não definida."
  exit 1
fi

psql "$DATABASE_URL" -f "ModelagemBanco/condoreserva_database.sql"
for migration in db/migrations/*.sql; do
  if [[ -f "$migration" ]]; then
    psql "$DATABASE_URL" -f "$migration"
  fi
done
