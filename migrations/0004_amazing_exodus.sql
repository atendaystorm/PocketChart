CREATE TABLE "recruiting_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"season" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recruiting_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"recruiting_class_id" integer NOT NULL,
	"player_name" text NOT NULL,
	"star_rating" integer NOT NULL,
	"position" varchar(10) NOT NULL,
	"height" text NOT NULL,
	"weight" integer NOT NULL,
	"national_rank" integer NOT NULL
);
