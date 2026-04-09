CREATE TABLE "trusted_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"clinic_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"user_agent_hash" varchar(255),
	"expires_at" timestamp NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "trusted_devices" ADD CONSTRAINT "trusted_devices_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "trusted_devices_token_hash_unique" ON "trusted_devices" USING btree ("token_hash");
--> statement-breakpoint
CREATE INDEX "trusted_devices_user_id_idx" ON "trusted_devices" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "trusted_devices_clinic_id_idx" ON "trusted_devices" USING btree ("clinic_id");
