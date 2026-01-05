import Fighter from "../models/Fighter";
import Division from "../models/Division";

export const updateFighterRanks = async () => {
  try {
    console.log("🔄 Starting Ranking Calculation...");

    // 1. Get all Divisions
    const divisions = await Division.findAll();

    for (const division of divisions) {
      // 2. Get all fighters in this division
      const fighters = await Fighter.findAll({
        where: { division_id: division.id },
        attributes: ["id", "wins", "losses", "draws"],
      });

      // 3. Calculate Score for each fighter
      // Formula: (Wins * 3) + (Draws * 1)
      const rankedFighters = fighters.map((f) => {
        const score = f.wins * 3 + f.draws * 1;
        return {
          id: f.id,
          score,
          losses: f.losses,
        };
      });

      // 4. Sort fighters
      // Primary Sort: Score (High to Low)
      // Secondary Sort: Losses (Low to High)
      rankedFighters.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score; // Higher score first
        }
        return a.losses - b.losses; // Fewer losses first (tie-breaker)
      });

      // 5. Update Ranks in Database
      // The fighter at index 0 gets Rank 1, index 1 gets Rank 2, etc.
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
