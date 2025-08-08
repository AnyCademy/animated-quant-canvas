


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."course_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."course_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'expired'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'student',
    'instructor',
    'admin',
    'super_admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


COMMENT ON TYPE "public"."user_role" IS 'Enum for user roles in the platform';



CREATE OR REPLACE FUNCTION "public"."calculate_split_payment"("course_amount" numeric, "fee_percentage" numeric DEFAULT 10, "fixed_fee" numeric DEFAULT 0) RETURNS TABLE("total_amount" numeric, "platform_fee" numeric, "instructor_share" numeric)
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    course_amount as total_amount,
    LEAST((course_amount * fee_percentage / 100) + fixed_fee, course_amount * 0.5) as platform_fee,
    course_amount - LEAST((course_amount * fee_percentage / 100) + fixed_fee, course_amount * 0.5) as instructor_share;
END;
$$;


ALTER FUNCTION "public"."calculate_split_payment"("course_amount" numeric, "fee_percentage" numeric, "fixed_fee" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_dashboard"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_dashboard_data (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_dashboard"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chapters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chapters" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "enrolled_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."course_enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "thumbnail_url" "text",
    "price" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "public"."course_status" DEFAULT 'draft'::"public"."course_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructor_bank_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid",
    "bank_name" "text" NOT NULL,
    "account_number" "text" NOT NULL,
    "account_holder_name" "text" NOT NULL,
    "bank_code" "text",
    "is_verified" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('UTC'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('UTC'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."instructor_bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "midtrans_order_id" "text" NOT NULL,
    "midtrans_transaction_id" "text",
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "payment_method" "text",
    "paid_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "split_payment_enabled" boolean DEFAULT false,
    "platform_fee" numeric(10,2) DEFAULT 0,
    "instructor_share" numeric(10,2) DEFAULT 0,
    "platform_fee_percentage" numeric(5,2) DEFAULT 0,
    CONSTRAINT "check_split_payment_amounts" CHECK ((("split_payment_enabled" = false) OR ("abs"((("platform_fee" + "instructor_share") - "amount")) < 0.01)))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payments"."split_payment_enabled" IS 'Whether this payment uses split billing between instructor and platform';



COMMENT ON COLUMN "public"."payments"."platform_fee" IS 'Amount of the payment that goes to the platform (in the same currency as amount)';



COMMENT ON COLUMN "public"."payments"."instructor_share" IS 'Amount of the payment that goes to the instructor (in the same currency as amount)';



COMMENT ON COLUMN "public"."payments"."platform_fee_percentage" IS 'Percentage of the total amount taken as platform fee';



CREATE OR REPLACE VIEW "public"."instructor_earnings_view" AS
 SELECT "c"."instructor_id",
    "p"."course_id",
    "c"."title" AS "course_title",
    "count"(*) AS "total_sales",
    "sum"("p"."amount") AS "total_course_revenue",
    "sum"("p"."instructor_share") AS "total_instructor_earnings",
    "sum"("p"."platform_fee") AS "total_platform_fees_paid",
    "avg"("p"."platform_fee_percentage") AS "avg_fee_percentage"
   FROM ("public"."payments" "p"
     JOIN "public"."courses" "c" ON (("p"."course_id" = "c"."id")))
  WHERE (("p"."status" = 'paid'::"public"."payment_status") AND ("p"."paid_at" IS NOT NULL))
  GROUP BY "c"."instructor_id", "p"."course_id", "c"."title"
  ORDER BY ("sum"("p"."instructor_share")) DESC;


ALTER TABLE "public"."instructor_earnings_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_batch_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "batch_id" "uuid",
    "revenue_split_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('UTC'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."payout_batch_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "instructor_id" "uuid",
    "total_amount" numeric(10,2) NOT NULL,
    "transaction_count" integer DEFAULT 0 NOT NULL,
    "payout_method" "text" DEFAULT 'manual_transfer'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "scheduled_date" "date",
    "processed_at" timestamp with time zone,
    "batch_reference" "text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('UTC'::"text", "now"()) NOT NULL,
    CONSTRAINT "payout_batches_payout_method_check" CHECK (("payout_method" = ANY (ARRAY['manual_transfer'::"text", 'bank_api'::"text", 'digital_wallet'::"text"]))),
    CONSTRAINT "payout_batches_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."payout_batches" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."platform_earnings_view" AS
 SELECT "date_trunc"('day'::"text", "payments"."paid_at") AS "date",
    "count"(*) AS "total_transactions",
    "sum"("payments"."amount") AS "total_revenue",
    "sum"("payments"."platform_fee") AS "total_platform_fees",
    "sum"("payments"."instructor_share") AS "total_instructor_payments",
    "avg"("payments"."platform_fee_percentage") AS "avg_fee_percentage"
   FROM "public"."payments"
  WHERE (("payments"."status" = 'paid'::"public"."payment_status") AND ("payments"."split_payment_enabled" = true) AND ("payments"."paid_at" IS NOT NULL))
  GROUP BY ("date_trunc"('day'::"text", "payments"."paid_at"))
  ORDER BY ("date_trunc"('day'::"text", "payments"."paid_at")) DESC;


ALTER TABLE "public"."platform_earnings_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "timezone"('UTC'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."platform_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "public"."user_role" DEFAULT 'student'::"public"."user_role" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."role" IS 'User role: student (default), instructor, admin, super_admin';



CREATE TABLE IF NOT EXISTS "public"."revenue_splits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid",
    "instructor_id" "uuid",
    "course_id" "uuid",
    "total_amount" numeric(10,2) NOT NULL,
    "platform_fee_percentage" numeric(5,2) NOT NULL,
    "platform_fee_amount" numeric(10,2) NOT NULL,
    "instructor_share" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('UTC'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('UTC'::"text", "now"()) NOT NULL,
    CONSTRAINT "revenue_splits_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'calculated'::"text", 'paid_out'::"text"])))
);


ALTER TABLE "public"."revenue_splits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_dashboard_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_courses_enrolled" integer DEFAULT 0,
    "courses_completed" integer DEFAULT 0,
    "current_streak" integer DEFAULT 0,
    "last_activity_date" timestamp with time zone DEFAULT "now"(),
    "preferred_learning_schedule" "text" DEFAULT 'flexible'::"text",
    "learning_goals" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_dashboard_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_video_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "video_id" "uuid" NOT NULL,
    "progress_seconds" integer DEFAULT 0 NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "last_watched_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_video_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chapter_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "video_url" "text" NOT NULL,
    "duration" integer,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructor_bank_accounts"
    ADD CONSTRAINT "instructor_bank_accounts_instructor_id_key" UNIQUE ("instructor_id");



ALTER TABLE ONLY "public"."instructor_bank_accounts"
    ADD CONSTRAINT "instructor_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_midtrans_order_id_key" UNIQUE ("midtrans_order_id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_batch_items"
    ADD CONSTRAINT "payout_batch_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_batches"
    ADD CONSTRAINT "payout_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."revenue_splits"
    ADD CONSTRAINT "revenue_splits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_dashboard_data"
    ADD CONSTRAINT "user_dashboard_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_dashboard_data"
    ADD CONSTRAINT "user_dashboard_data_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_video_progress"
    ADD CONSTRAINT "user_video_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_video_progress"
    ADD CONSTRAINT "user_video_progress_user_id_video_id_key" UNIQUE ("user_id", "video_id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chapters_course_id" ON "public"."chapters" USING "btree" ("course_id");



CREATE INDEX "idx_course_enrollments_course_id" ON "public"."course_enrollments" USING "btree" ("course_id");



CREATE INDEX "idx_course_enrollments_user_id" ON "public"."course_enrollments" USING "btree" ("user_id");



CREATE INDEX "idx_courses_instructor_id" ON "public"."courses" USING "btree" ("instructor_id");



CREATE INDEX "idx_courses_status" ON "public"."courses" USING "btree" ("status");



CREATE INDEX "idx_payments_course_id" ON "public"."payments" USING "btree" ("course_id");



CREATE INDEX "idx_payments_midtrans_order_id" ON "public"."payments" USING "btree" ("midtrans_order_id");



CREATE INDEX "idx_payments_split_payment_enabled" ON "public"."payments" USING "btree" ("split_payment_enabled") WHERE ("split_payment_enabled" = true);



CREATE INDEX "idx_payments_user_id" ON "public"."payments" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_user_video_progress_user_id" ON "public"."user_video_progress" USING "btree" ("user_id");



CREATE INDEX "idx_user_video_progress_video_id" ON "public"."user_video_progress" USING "btree" ("video_id");



CREATE INDEX "idx_videos_chapter_id" ON "public"."videos" USING "btree" ("chapter_id");



ALTER TABLE ONLY "public"."chapters"
    ADD CONSTRAINT "chapters_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_enrollments"
    ADD CONSTRAINT "course_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."instructor_bank_accounts"
    ADD CONSTRAINT "instructor_bank_accounts_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payout_batch_items"
    ADD CONSTRAINT "payout_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."payout_batches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_batch_items"
    ADD CONSTRAINT "payout_batch_items_revenue_split_id_fkey" FOREIGN KEY ("revenue_split_id") REFERENCES "public"."revenue_splits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_batches"
    ADD CONSTRAINT "payout_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."payout_batches"
    ADD CONSTRAINT "payout_batches_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."platform_settings"
    ADD CONSTRAINT "platform_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."revenue_splits"
    ADD CONSTRAINT "revenue_splits_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."revenue_splits"
    ADD CONSTRAINT "revenue_splits_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."revenue_splits"
    ADD CONSTRAINT "revenue_splits_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_dashboard_data"
    ADD CONSTRAINT "user_dashboard_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_video_progress"
    ADD CONSTRAINT "user_video_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_video_progress"
    ADD CONSTRAINT "user_video_progress_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view chapters of published courses" ON "public"."chapters" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "chapters"."course_id") AND ("courses"."status" = 'published'::"public"."course_status")))));



CREATE POLICY "Anyone can view published courses" ON "public"."courses" FOR SELECT USING (("status" = 'published'::"public"."course_status"));



CREATE POLICY "Enrolled users can view videos" ON "public"."videos" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM (("public"."chapters" "ch"
     JOIN "public"."courses" "c" ON (("c"."id" = "ch"."course_id")))
     JOIN "public"."course_enrollments" "ce" ON (("ce"."course_id" = "c"."id")))
  WHERE (("ch"."id" = "videos"."chapter_id") AND ("ce"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."chapters" "ch"
     JOIN "public"."courses" "c" ON (("c"."id" = "ch"."course_id")))
  WHERE (("ch"."id" = "videos"."chapter_id") AND ("c"."instructor_id" = "auth"."uid"()))))));



CREATE POLICY "Instructors can manage their course chapters" ON "public"."chapters" USING ((EXISTS ( SELECT 1
   FROM "public"."courses"
  WHERE (("courses"."id" = "chapters"."course_id") AND ("courses"."instructor_id" = "auth"."uid"())))));



CREATE POLICY "Instructors can manage their course videos" ON "public"."videos" USING ((EXISTS ( SELECT 1
   FROM ("public"."chapters" "ch"
     JOIN "public"."courses" "c" ON (("c"."id" = "ch"."course_id")))
  WHERE (("ch"."id" = "videos"."chapter_id") AND ("c"."instructor_id" = "auth"."uid"())))));



CREATE POLICY "Instructors can manage their own courses" ON "public"."courses" USING (("auth"."uid"() = "instructor_id"));



CREATE POLICY "Users can create their own payments" ON "public"."payments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can enroll themselves" ON "public"."course_enrollments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own dashboard data" ON "public"."user_dashboard_data" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage their own progress" ON "public"."user_video_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own dashboard data" ON "public"."user_dashboard_data" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own payments" ON "public"."payments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own dashboard data" ON "public"."user_dashboard_data" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own enrollments" ON "public"."course_enrollments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payments" ON "public"."payments" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "admin_payments_access" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"]))))));



ALTER TABLE "public"."chapters" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "instructor_course_management" ON "public"."courses" TO "authenticated" USING ((("instructor_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'super_admin'::"public"."user_role"])))))));



ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_dashboard_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_video_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."calculate_split_payment"("course_amount" numeric, "fee_percentage" numeric, "fixed_fee" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_split_payment"("course_amount" numeric, "fee_percentage" numeric, "fixed_fee" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_split_payment"("course_amount" numeric, "fee_percentage" numeric, "fixed_fee" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_dashboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_dashboard"() TO "service_role";


















GRANT ALL ON TABLE "public"."chapters" TO "anon";
GRANT ALL ON TABLE "public"."chapters" TO "authenticated";
GRANT ALL ON TABLE "public"."chapters" TO "service_role";



GRANT ALL ON TABLE "public"."course_enrollments" TO "anon";
GRANT ALL ON TABLE "public"."course_enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."course_enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."instructor_bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."instructor_earnings_view" TO "anon";
GRANT ALL ON TABLE "public"."instructor_earnings_view" TO "authenticated";
GRANT ALL ON TABLE "public"."instructor_earnings_view" TO "service_role";



GRANT ALL ON TABLE "public"."payout_batch_items" TO "anon";
GRANT ALL ON TABLE "public"."payout_batch_items" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_batch_items" TO "service_role";



GRANT ALL ON TABLE "public"."payout_batches" TO "anon";
GRANT ALL ON TABLE "public"."payout_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_batches" TO "service_role";



GRANT ALL ON TABLE "public"."platform_earnings_view" TO "anon";
GRANT ALL ON TABLE "public"."platform_earnings_view" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_earnings_view" TO "service_role";



GRANT ALL ON TABLE "public"."platform_settings" TO "anon";
GRANT ALL ON TABLE "public"."platform_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_settings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."revenue_splits" TO "anon";
GRANT ALL ON TABLE "public"."revenue_splits" TO "authenticated";
GRANT ALL ON TABLE "public"."revenue_splits" TO "service_role";



GRANT ALL ON TABLE "public"."user_dashboard_data" TO "anon";
GRANT ALL ON TABLE "public"."user_dashboard_data" TO "authenticated";
GRANT ALL ON TABLE "public"."user_dashboard_data" TO "service_role";



GRANT ALL ON TABLE "public"."user_video_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_video_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_video_progress" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
