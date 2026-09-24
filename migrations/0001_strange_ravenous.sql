CREATE TABLE "team_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"record_type" varchar(20) NOT NULL,
	"category" varchar(50) NOT NULL,
	"player_name" text NOT NULL,
	"value" integer NOT NULL,
	"season" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "depth_chart_entries" ADD COLUMN "dev_trait" varchar(20) DEFAULT 'Normal' NOT NULL;