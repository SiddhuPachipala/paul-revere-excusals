CREATE TABLE public.semester_pt_excusal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cadet_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  semester text NOT NULL CHECK (semester ~ '^(Spring|Fall) [0-9]{4}$'),
  reason text NOT NULL CHECK (NULLIF(btrim(reason), '') IS NOT NULL),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  staff_notes text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(id),
  UNIQUE (cadet_id, semester)
);

ALTER TABLE public.semester_pt_excusal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible semester PT requests" ON public.semester_pt_excusal_requests
  FOR SELECT TO authenticated USING (cadet_id = auth.uid() OR private.is_staff());

CREATE POLICY "Users can submit own semester PT requests" ON public.semester_pt_excusal_requests
  FOR INSERT TO authenticated WITH CHECK (
    cadet_id = auth.uid() AND status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      AND NULLIF(btrim(p.first_name), '') IS NOT NULL AND NULLIF(btrim(p.last_name), '') IS NOT NULL
      AND NULLIF(btrim(p.email), '') IS NOT NULL AND NULLIF(btrim(p.phone), '') IS NOT NULL
      AND NULLIF(btrim(p.company), '') IS NOT NULL AND NULLIF(btrim(p.ms_level), '') IS NOT NULL
      AND NULLIF(btrim(p.ms_instructor), '') IS NOT NULL AND NULLIF(btrim(p.company_commander), '') IS NOT NULL
      AND NULLIF(btrim(p.position), '') IS NOT NULL)
  );

CREATE POLICY "Staff can review semester PT requests" ON public.semester_pt_excusal_requests
  FOR UPDATE TO authenticated USING (private.is_staff()) WITH CHECK (private.is_staff());

CREATE TRIGGER enforce_semester_pt_review BEFORE UPDATE ON public.semester_pt_excusal_requests
  FOR EACH ROW EXECUTE FUNCTION private.enforce_semester_pt_review();

GRANT SELECT, INSERT, UPDATE ON public.semester_pt_excusal_requests TO authenticated;
GRANT ALL ON public.semester_pt_excusal_requests TO postgres, service_role;
