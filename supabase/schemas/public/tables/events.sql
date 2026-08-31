CREATE TABLE "public"."events" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "name"                text                     NOT NULL,
  "event_type"          text,
  "start_at"            timestamp with time zone NOT NULL,
  "end_at"              timestamp with time zone,
  "location"            text,
  "company"             text                     NOT NULL DEFAULT 'ALL'::text,
  "request_deadline"    timestamp with time zone,
  "makeup_instructions" text,
  "is_active"           boolean                  NOT NULL DEFAULT true,
  "created_by"          uuid,
  "created_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"          timestamp with time zone NOT NULL DEFAULT now(),
  "source"              text                     NOT NULL DEFAULT 'manual'::text,
  "external_calendar_id" text,
  "external_event_id"   text,
  "external_occurrence_id" text,
  "external_updated_at" timestamp with time zone,
  CONSTRAINT "events_company_check" CHECK ((company = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'ALL'::text]))),
  CONSTRAINT "events_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'google'::text]))),
  CONSTRAINT "events_pkey" PRIMARY KEY (id),
  CONSTRAINT "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE UNIQUE INDEX "events_google_occurrence_key"
  ON "public"."events" USING btree ("external_calendar_id", "external_occurrence_id");

ALTER TABLE "public"."events"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can create events" ON "public"."events"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (private.is_staff());

CREATE POLICY "Staff can delete events" ON "public"."events"
  FOR DELETE
  TO "authenticated"
  USING (private.is_staff());

CREATE POLICY "Staff can update events" ON "public"."events"
  FOR UPDATE
  TO "authenticated"
  USING (private.is_staff())
  WITH CHECK (private.is_staff());

CREATE POLICY "Users can view applicable events" ON "public"."events"
  FOR SELECT
  TO "authenticated"
  USING ((private.is_staff() OR (company = 'ALL'::text) OR (company = ( SELECT p.company
   FROM public.profiles p
  WHERE (p.id = ( SELECT auth.uid() AS uid))))));

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "public"."events" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."events" TO "postgres", "service_role";
