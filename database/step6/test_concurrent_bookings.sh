#!/usr/bin/env bash
# FOTOPOLIS step 6: actual PostgreSQL simultaneous-booking collision test.
# Operates ONLY on the ephemeral postgres:17 CI container.
set -euo pipefail
: "${PGPASSWORD:?This script requires a disposable CI PostgreSQL password}"
DB_HOST="${PGHOST:-127.0.0.1}"
DB_NAME="${PGDATABASE:-fotopolis_test}"
psql_test() {
  psql -X -v ON_ERROR_STOP=1 -h "$DB_HOST" -U postgres -d "$DB_NAME" "$@"
}
resource="$(psql_test -Atc "INSERT INTO fotopolis.resources (resource_code,product_type,display_name,enabled) VALUES ('TEST-RACE-BOX','fotobox','Test race resource',true) RETURNING id" | head -1)"
[[ "$resource" =~ ^[0-9a-f-]{36}$ ]] || { echo "ERROR missing test resource"; exit 1; }
first_output="$(mktemp)"
second_output="$(mktemp)"
trap 'rm -f "$first_output" "$second_output"' EXIT

# Transaction 1 holds its uncommitted GiST exclusion index entry.
(
  psql_test <<SQL
BEGIN;
INSERT INTO fotopolis.allocations
(resource_id,allocation_kind,allocation_state,event_start_at,event_end_at,occupied_from,occupied_until)
VALUES ('$resource','booking','confirmed','2027-09-01 11:00+02','2027-09-01 14:00+02',
        '2027-09-01 10:00+02','2027-09-01 15:00+02');
SELECT pg_sleep(4);
COMMIT;
SQL
) >"$first_output" 2>&1 &
first_pid=$!
# Give the first transaction time to enter its four-second holding window.
sleep 1
set +e
psql_test -c "INSERT INTO fotopolis.allocations
(resource_id,allocation_kind,allocation_state,event_start_at,event_end_at,occupied_from,occupied_until)
VALUES ('$resource','booking','held','2027-09-01 12:00+02','2027-09-01 13:00+02',
        '2027-09-01 11:30+02','2027-09-01 14:30+02');" >"$second_output" 2>&1
second_rc=$?
set -e
wait "$first_pid"
if [[ "$second_rc" -eq 0 ]]; then
  echo "FAIL: concurrent overlapping transaction was accepted"
  cat "$second_output"
  exit 1
fi
if ! grep -Eq 'conflicting key value violates exclusion constraint' "$second_output"; then
  echo "FAIL: concurrent transaction rejected for a different reason"
  cat "$second_output"
  exit 1
fi
count="$(psql_test -Atc "SELECT count(*) FROM fotopolis.allocations WHERE resource_id='$resource'")"
[[ "$count" == "1" ]] || { echo "FAIL: expected exactly one committed allocation, got $count"; exit 1; }
echo "PASS: simultaneous booking attempts on the same device -> exactly one confirmed; second rejected by PostgreSQL exclusion constraint"

# The same time window on a DIFFERENT device must work.
second_resource="$(psql_test -Atc "INSERT INTO fotopolis.resources(resource_code,product_type,display_name,enabled) VALUES('TEST-RACE-BOX-B','fotobox','Independent second box',true) RETURNING id" | head -1)"
psql_test -q -c "INSERT INTO fotopolis.allocations
(resource_id,allocation_kind,allocation_state,event_start_at,event_end_at,occupied_from,occupied_until)
VALUES ('$second_resource','booking','confirmed','2027-09-01 11:00+02','2027-09-01 14:00+02',
        '2027-09-01 10:00+02','2027-09-01 15:00+02');"
echo "PASS: a second independently rentable physical unit remains bookable for the same interval"
