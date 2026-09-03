CREATE TABLE "public"."excusal_requests" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "cadet_id"      uuid                     NOT NULL,
  "event_id"      uuid                     NOT NULL,
  "reason"        text                     NOT NULL,
  "makeup_plan"   text                     NOT NULL,
  "status"        text                     NOT NULL DEFAULT 'pending'::text,
  "staff_notes"   text,
  "submitted_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "reviewed_at"   timestamp with time zone,
  "reviewed_by"   uuid,
  "memo_snapshot" jsonb,
  CONSTRAINT "excusal_requests_cadet_id_event_id_key" UNIQUE (cadet_id, event_id),
  CONSTRAINT "excusal_requests_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE,
  CONSTRAINT "excusal_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "excusal_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'denied'::text, 'changes_requested'::text]))),
  CONSTRAINT "excusal_requests_cadet_id_fkey" FOREIGN KEY (cadet_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT "excusal_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);

ALTER TABLE "public"."excusal_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cadets can delete pending own requests" ON "public"."excusal_requests"
  FOR DELETE
  TO "authenticated"
  USING (((cadet_id = auth.uid()) AND (status = 'pending'::text)));

CREATE POLICY "Cadets can submit applicable requests" ON "public"."excusal_requests"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((cadet_id = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM (public.events e
     JOIN public.profiles p ON ((p.id = ( SELECT auth.uid() AS uid))))
  WHERE
    ((e.id = excusal_requests.event_id) AND e.is_active AND (e.start_at > now()) AND ((e.request_deadline IS NULL) OR (e.request_deadline >= now())) AND ((e.company = 'ALL'::text)
    OR (e.company = p.company)))
    AND (NULLIF(btrim(p.first_name), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.last_name), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.email), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.phone), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.company), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.ms_level), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.ms_instructor), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.company_commander), ''::text) IS NOT NULL)
    AND (NULLIF(btrim(p.position), ''::text) IS NOT NULL))))));

CREATE POLICY "Cadets can view own requests" ON "public"."excusal_requests"
  FOR SELECT
  TO "authenticated"
  USING (((cadet_id = auth.uid()) OR private.is_staff()));

CREATE POLICY "Owners can resubmit requested changes" ON "public"."excusal_requests"
  FOR UPDATE
  TO "authenticated"
  USING (((cadet_id = auth.uid()) AND (status = 'changes_requested'::text)))
  WITH CHECK (((cadet_id = auth.uid()) AND (status = 'pending'::text)));

CREATE POLICY "Staff can review requests" ON "public"."excusal_requests"
  FOR UPDATE
  TO "authenticated"
  USING (private.is_staff())
  WITH CHECK (private.is_staff());

CREATE TRIGGER "enforce_excusal_update"
  BEFORE UPDATE ON "public"."excusal_requests"
  FOR EACH ROW EXECUTE FUNCTION private.enforce_excusal_update();

CREATE TRIGGER "require_complete_profile_for_excusal"
  BEFORE INSERT OR UPDATE ON "public"."excusal_requests"
  FOR EACH ROW EXECUTE FUNCTION private.require_complete_profile_for_excusal();

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."excusal_requests" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."excusal_requests" TO "postgres", "service_role";
