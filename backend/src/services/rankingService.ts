import Fighter from "../models/Fighter";
import Division from "../models/Division";

export const updateFighterRanks = async () => {
  try {
    console.log("🔄 Starting Ranking Calculation...");

    const divisions = await Division.findAll();

    for (const division of divisions) {
      const fighters = await Fighter.findAll({
        where: { division_id: division.id },
        attributes: ["id", "wins", "losses", "draws"],
      });

      const rankedFighters = fighters.map((f) => {
        const score = f.wins * 3 + f.draws * 1;
        return {
          id: f.id,
          score,
          losses: f.losses,
        };
      });

      rankedFighters.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.losses - b.losses;
      });

      for (let i = 0; i < rankedFighters.length; i++) {
        const rank = i + 1;
        await Fighter.update(
          { ranking: rank },
          { where: { id: rankedFighters[i].id } }
        );
      }
    }

    console.log("✅ Fighter ranks updated successfully.");
  } catch (error) {
    console.error("❌ Error updating ranks:", error);
  }
};
