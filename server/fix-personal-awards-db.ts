import { db } from "./db";
import { sql } from "drizzle-orm";

async function fixPersonalAwardsDatabase() {
  await db.execute(sql`
    ALTER TABLE personal_awards
    ALTER COLUMN award DROP NOT NULL
  `);

  console.log("Removed NOT NULL requirement from legacy award column.");
}

fixPersonalAwardsDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });