-- Execute ONLY against disposable PostgreSQL (CI). Never run against user data.
-- The whole fixture is rolled back. Success is indicated by RAISE NOTICE.
\set ON_ERROR_STOP on
BEGIN;

DO $suite$
DECLARE
  box_a uuid;
  box_b uuid;
  mirror uuid;
  camper uuid;
  first_allocation uuid;
  hold_allocation uuid;
  n integer;
  ok boolean;
BEGIN
  INSERT INTO fotopolis.resources(resource_code,product_type,display_name,enabled)
    VALUES ('TEST-BOX-01','fotobox','Test-Fotobox eins',true) RETURNING id INTO box_a;
  INSERT INTO fotopolis.resources(resource_code,product_type,display_name,enabled)
    VALUES ('TEST-BOX-02','fotobox','Test-Fotobox zwei',true) RETURNING id INTO box_b;
  INSERT INTO fotopolis.resources(resource_code,product_type,display_name,enabled)
    VALUES ('TEST-MIRROR-01','fotospiegel','Test-Spiegel',true) RETURNING id INTO mirror;
  INSERT INTO fotopolis.resources(resource_code,product_type,display_name,enabled)
    VALUES ('TEST-CAMPER-01','fotowohnwagen','Test-Camper',false) RETURNING id INTO camper;
  RAISE NOTICE 'PASS: distinct physical resources created; camper disabled by default for availability';

  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-06-14 10:00+02','2027-06-14 12:00+02','fotobox'
  );
  IF n <> 2 THEN RAISE EXCEPTION 'Expected both free boxes, found %',n; END IF;
  RAISE NOTICE 'PASS: two individual devices in same product family are available';

  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-06-14 10:00+02','2027-06-14 12:00+02','fotowohnwagen'
  );
  IF n <> 0 THEN RAISE EXCEPTION 'Disabled camper appeared in availability'; END IF;
  RAISE NOTICE 'PASS: disabled inventory is not advertised as free';

  INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
    event_start_at,event_end_at,occupied_from,occupied_until)
  VALUES(box_a,'booking','confirmed',
    '2027-06-14 10:00+02','2027-06-14 14:00+02',
    '2027-06-14 09:00+02','2027-06-14 15:30+02')
  RETURNING id INTO first_allocation;
  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-06-14 08:30+02','2027-06-14 09:30+02','fotobox'
  );
  IF n <> 1 THEN RAISE EXCEPTION 'Setup/travel buffer not considered'; END IF;
  RAISE NOTICE 'PASS: occupancy includes setup and travel, not just event time';

  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-06-14 10:00+02','2027-06-14 12:00+02','fotobox'
  );
  IF n <> 1 THEN RAISE EXCEPTION 'Expected one remaining box'; END IF;
  RAISE NOTICE 'PASS: same product remains available on a different physical unit';

  BEGIN
    INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
      event_start_at,event_end_at,occupied_from,occupied_until)
    VALUES(box_a,'booking','confirmed',
      '2027-06-14 15:00+02','2027-06-14 16:00+02',
      '2027-06-14 14:30+02','2027-06-14 16:30+02');
    RAISE EXCEPTION 'Overlapping booking was accepted';
  EXCEPTION WHEN exclusion_violation THEN
    RAISE NOTICE 'PASS: GiST constraint rejects overlapping allocation of same device';
  END;

  INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
    event_start_at,event_end_at,occupied_from,occupied_until)
  VALUES(box_a,'booking','confirmed',
    '2027-06-14 15:30+02','2027-06-14 17:00+02',
    '2027-06-14 15:30+02','2027-06-14 17:15+02');
  RAISE NOTICE 'PASS: adjacent half-open [start,end) allocations do not conflict';

  INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
    event_start_at,event_end_at,occupied_from,occupied_until)
  VALUES(box_b,'booking','held',
    '2027-06-15 10:00+02','2027-06-15 13:00+02',
    '2027-06-15 09:30+02','2027-06-15 13:30+02')
  RETURNING id INTO hold_allocation;
  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-06-15 12:00+02','2027-06-15 12:30+02','fotobox'
  );
  IF n <> 1 THEN RAISE EXCEPTION 'Active held state did not block resource'; END IF;
  RAISE NOTICE 'PASS: held reservation blocks conflicts conservatively';

  UPDATE fotopolis.allocations SET allocation_state='cancelled' WHERE id=hold_allocation;
  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-06-15 12:00+02','2027-06-15 12:30+02','fotobox'
  );
  IF n <> 2 THEN RAISE EXCEPTION 'Cancel did not release device'; END IF;
  RAISE NOTICE 'PASS: cancel releases reservation while retaining audit history';

  INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
    event_start_at,event_end_at,occupied_from,occupied_until)
  VALUES(mirror,'internal_block','blocked',
    '2027-07-02 10:00+02','2027-07-02 18:00+02',
    '2027-07-02 10:00+02','2027-07-02 18:00+02');
  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-07-02 15:00+02','2027-07-02 17:00+02','fotospiegel'
  );
  IF n <> 0 THEN RAISE EXCEPTION 'Internal block not respected'; END IF;
  RAISE NOTICE 'PASS: internal absence/block is enforced';

  INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
    event_start_at,event_end_at,occupied_from,occupied_until)
  VALUES(camper,'maintenance','blocked',
    '2027-07-04 09:00+02','2027-07-04 19:00+02',
    '2027-07-04 09:00+02','2027-07-04 19:00+02');
  UPDATE fotopolis.resources SET enabled=true WHERE id=camper;
  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-07-04 11:00+02','2027-07-04 12:00+02','fotowohnwagen'
  );
  IF n <> 0 THEN RAISE EXCEPTION 'Maintenance block not respected'; END IF;
  RAISE NOTICE 'PASS: maintenance blocks even after resource activation';

  BEGIN
    INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
      event_start_at,event_end_at,occupied_from,occupied_until)
    VALUES(box_a,'booking','confirmed',
      '2027-08-01 14:00+02','2027-08-01 11:00+02',
      '2027-08-01 09:00+02','2027-08-01 18:00+02');
    RAISE EXCEPTION 'Reversed event time was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: invalid/reversed time window blocked';
  END;

  BEGIN
    INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
      event_start_at,event_end_at,occupied_from,occupied_until)
    VALUES(box_a,'maintenance','confirmed',
      '2027-08-01 10:00+02','2027-08-01 12:00+02',
      '2027-08-01 09:00+02','2027-08-01 13:00+02');
    RAISE EXCEPTION 'Invalid kind/state accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: invalid booking/maintenance states blocked';
  END;

  BEGIN
    PERFORM * FROM fotopolis.available_resources(
      '2027-08-01 13:00+02','2027-08-01 10:00+02','fotobox'
    );
    RAISE EXCEPTION 'Invalid availability query accepted';
  EXCEPTION WHEN SQLSTATE '22007' THEN
    RAISE NOTICE 'PASS: reversed availability query rejected';
  END;

  BEGIN
    PERFORM * FROM fotopolis.available_resources(
      '2027-08-01 10:00+02','2027-08-01 12:00+02','unknown_product'
    );
    RAISE EXCEPTION 'Unknown product type accepted';
  EXCEPTION WHEN invalid_parameter_value THEN
    RAISE NOTICE 'PASS: unknown product type rejected';
  END;

  -- Europe's 2027 spring-forward instant: 01:30+01 to 03:30+02 is
  -- one actual hour. Store instants, never hardcode UTC offsets by season.
  INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
    event_start_at,event_end_at,occupied_from,occupied_until)
  VALUES(mirror,'booking','confirmed',
    '2027-03-28 01:30+01','2027-03-28 03:30+02',
    '2027-03-28 01:00+01','2027-03-28 04:00+02');
  SELECT count(*) INTO n FROM fotopolis.available_resources(
    '2027-03-28 01:45+01','2027-03-28 03:45+02','fotospiegel'
  );
  IF n <> 0 THEN RAISE EXCEPTION 'DST overlap not handled as UTC instants'; END IF;
  RAISE NOTICE 'PASS: DST transition correctly handled using timestamptz';

  SELECT count(*) INTO n FROM fotopolis.allocation_audit
    WHERE allocation_id=first_allocation AND action='INSERT';
  IF n <> 1 THEN RAISE EXCEPTION 'Insert audit missing'; END IF;
  SELECT count(*) INTO n FROM fotopolis.allocation_audit
    WHERE allocation_id=hold_allocation AND action='UPDATE'
      AND before_state->>'allocation_state'='held'
      AND after_state->>'allocation_state'='cancelled';
  IF n <> 1 THEN RAISE EXCEPTION 'Cancellation audit missing'; END IF;
  RAISE NOTICE 'PASS: inserts and cancellations recorded in audit';

  SELECT bool_and(c.relrowsecurity) INTO ok FROM pg_class c
    JOIN pg_namespace ns ON ns.oid=c.relnamespace
    WHERE ns.nspname='fotopolis' AND c.relkind='r';
  IF NOT coalesce(ok,false) THEN RAISE EXCEPTION 'RLS not enabled on all private tables'; END IF;
  IF has_schema_privilege('anon','fotopolis','USAGE')
     OR has_schema_privilege('authenticated','fotopolis','USAGE') THEN
    RAISE EXCEPTION 'Unexpected client access to private booking schema';
  END IF;
  RAISE NOTICE 'PASS: RLS active and anonymous/authenticated schema access denied';
END;
$suite$;

ROLLBACK; -- no persistent fixture/customer data
