import { db } from "./db";
import { sql } from "drizzle-orm";

async function migratePersonalAwards() {
  await db.execute(sql`
    DELETE FROM personal_awards
    WHERE award_type_id IS NULL
  `);

  console.log("Removed awards without trophy images.");
}

migratePersonalAwards()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });