CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"description" text NOT NULL,
	"points" integer,
	"timestamp" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_type" text NOT NULL,
	"awarded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"read" boolean DEFAULT false,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"collector_id" integer,
	"waste_type" text NOT NULL,
	"waste_description" text,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"completed_date" timestamp,
	"waste_amount" real,
	"address" text NOT NULL,
	"location" json,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "eco_tips" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"icon" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "impacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"collection_id" integer,
	"water_saved" real DEFAULT 0,
	"co2_reduced" real DEFAULT 0,
	"trees_equivalent" real DEFAULT 0,
	"energy_conserved" real DEFAULT 0,
	"waste_amount" real DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "material_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"collection_id" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'household' NOT NULL,
	"address" text,
	"phone" text,
	"sustainability_score" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"organization_type" text,
	"organization_name" text,
	"contact_person_name" text,
	"contact_person_position" text,
	"contact_person_phone" text,
	"contact_person_email" text,
	"is_certified" boolean,
	"certification_details" text,
	"business_type" text,
	"business_name" text,
	"waste_specialization" text[],
	"service_location" text,
	"service_type" text,
	"operating_hours" text,
	"onboarding_completed" boolean DEFAULT false,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_interests" ADD CONSTRAINT "material_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_interests" ADD CONSTRAINT "material_interests_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;