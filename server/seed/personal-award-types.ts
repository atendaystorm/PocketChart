import { db } from "../db";
import { personalAwardTypes } from "@shared/schema";

const awards = [
  {
    awardName: "Chuck Bednarik Award",
    awardShortName: "Bednarik",
    trophyImageUrl: "/awards/bednarik.png",
  },
  {
    awardName: "Biletnikoff Award",
    awardShortName: "Biletnikoff",
    trophyImageUrl: "/awards/biletnikoff.png",
  },
  {
    awardName: "Bronko Nagurski Trophy",
    awardShortName: "Nagurski",
    trophyImageUrl: "/awards/nagurski.png",
  },
  {
    awardName: "Butkus Award",
    awardShortName: "Butkus",
    trophyImageUrl: "/awards/butkus.png",
  },
  {
    awardName: "Davey O'Brien Award",
    awardShortName: "O'Brien",
    trophyImageUrl: "/awards/obrien.png",
  },
  {
    awardName: "Doak Walker Award",
    awardShortName: "Doak Walker",
    trophyImageUrl: "/awards/walker.png",
  },
  {
    awardName: "Heisman Trophy",
    awardShortName: "Heisman",
    trophyImageUrl: "/awards/heisman.png",
  },
  {
    awardName: "Paycom Jim Thorpe Award",
    awardShortName: "Jim Thorpe",
    trophyImageUrl: "/awards/thorpe.png",
  },
  {
    awardName: "John Mackey Award",
    awardShortName: "Mackey",
    trophyImageUrl: "/awards/mackey.png",
  },
  {
    awardName: "Lombardi Award",
    awardShortName: "Lombardi",
    trophyImageUrl: "/awards/lombardi.png",
  },
  {
    awardName: "Lou Groza Award",
    awardShortName: "Lou Groza",
    trophyImageUrl: "/awards/groza.png",
  },
  {
    awardName: "Maxwell Award",
    awardShortName: "Maxwell",
    trophyImageUrl: "/awards/maxwell.png",
  },
  {
    awardName: "Outland Trophy",
    awardShortName: "Outland",
    trophyImageUrl: "/awards/outland.png",
  },
  {
    awardName: "Ray Guy Award",
    awardShortName: "Ray Guy",
    trophyImageUrl: "/awards/guy.png",
  },
  {
    awardName: "Rimington Trophy",
    awardShortName: "Rimington",
    trophyImageUrl: "/awards/rimington.png",
  },
  {
    awardName: "Walter Camp Award",
    awardShortName: "Walter Camp",
    trophyImageUrl: "/awards/camp.png",
  },
];

async function seedPersonalAwardTypes() {
  console.log("Seeding personal award types...");

  for (const award of awards) {
    await db
      .insert(personalAwardTypes)
      .values(award)
      .onConflictDoUpdate({
        target: personalAwardTypes.awardName,
        set: {
          awardShortName: award.awardShortName,
          trophyImageUrl: award.trophyImageUrl,
        },
      });

    console.log(`Added: ${award.awardName}`);
  }

  console.log("Personal award types seeded successfully.");
}

seedPersonalAwardTypes()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });