CREATE OR REPLACE FUNCTION private.enforce_dated_pt_review()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
  IF NOT private.is_staff() THEN RAISE EXCEPTION 'Only staff can review this request'; END IF;
  IF old.status <> 'pending' OR new.status NOT IN ('approved', 'denied') THEN
    RAISE EXCEPTION 'Only pending requests can be reviewed';
  END IF;
  IF new.id IS DISTINCT FROM old.id OR new.cadet_id IS DISTINCT FROM old.cadet_id
    OR new.pt_date IS DISTINCT FROM old.pt_date OR new.reason IS DISTINCT FROM old.reason
    OR new.submitted_at IS DISTINCT FROM old.submitted_at THEN
    RAISE EXCEPTION 'Staff may only update review fields';
  END IF;
  IF new.reviewed_by IS DISTINCT FROM auth.uid() OR new.reviewed_at IS NULL THEN
    RAISE EXCEPTION 'Reviewer and review timestamp are required';
  END IF;
  IF new.reviewed_by = old.cadet_id THEN RAISE EXCEPTION 'Users may not review their own requests'; END IF;
  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_dated_pt_review() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.enforce_dated_pt_review() TO postgres, service_role;
