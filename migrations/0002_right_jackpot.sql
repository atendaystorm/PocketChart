CREATE TABLE "personal_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"award" varchar(100) NOT NULL,
	"season" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"award_type" varchar(50) NOT NULL,
	"opponent" text NOT NULL,
	"final_score" text NOT NULL,
	"season" integer NOT NULL
);
