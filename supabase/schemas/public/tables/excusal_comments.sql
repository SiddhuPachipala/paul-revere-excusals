CREATE TABLE "public"."excusal_comments" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "request_id" uuid                     NOT NULL,
  "author_id"  uuid                     NOT NULL,
  "body"       text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "excusal_comments_pkey" PRIMARY KEY (id),
  CONSTRAINT "excusal_comments_request_id_fkey" FOREIGN KEY (request_id) REFERENCES public.excusal_requests(id) ON DELETE CASCADE,
  CONSTRAINT "excusal_comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);

ALTER TABLE "public"."excusal_comments"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can add comments to accessible requests" ON "public"."excusal_comments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((author_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.excusal_requests r
  WHERE ((r.id = excusal_comments.request_id) AND ((r.cadet_id = auth.uid()) OR private.is_staff()))))));

CREATE POLICY "Users can view comments on accessible requests" ON "public"."excusal_comments"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.excusal_requests r
  WHERE ((r.id = excusal_comments.request_id) AND ((r.cadet_id = auth.uid()) OR private.is_staff())))));

GRANT INSERT, SELECT ON TABLE "public"."excusal_comments" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."excusal_comments" TO "postgres", "service_role";
