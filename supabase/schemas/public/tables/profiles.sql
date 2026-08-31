CREATE TABLE "public"."profiles" (
  "id"                uuid                     NOT NULL,
  "first_name"        text,
  "last_name"         text,
  "email"             text,
  "phone"             text,
  "role"              text                     NOT NULL DEFAULT 'cadet'::text,
  "company"           text,
  "ms_level"          text,
  "ms_instructor"     text,
  "company_commander" text,
  "position"          text,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_company_check" CHECK (((company = ANY (ARRAY['A'::text, 'B'::text, 'C'::text])) OR (company IS NULL))),
  CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['cadet'::text, 'staff'::text, 'admin'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can update profiles" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Users can read own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = auth.uid()) OR private.is_staff()));

GRANT SELECT, UPDATE ON TABLE "public"."profiles" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres", "service_role";
