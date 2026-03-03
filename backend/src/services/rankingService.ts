import sequelize from "../config/sequelize";
import { logger } from "../utils/logger";

export const updateFighterRanks = async () => {
  try {
    logger.info("🔄 Starting Ranking Calculation...");

    await sequelize.query(`
      WITH RankedFighters AS (
        SELECT id, 
               ROW_NUMBER() OVER(
                 PARTITION BY division_id 
                 ORDER BY (wins * 3 + draws * 1) DESC, losses ASC
               ) as new_ranking
        FROM fighters
      )
      UPDATE fighters
      SET ranking = RankedFighters.new_ranking
      FROM RankedFighters
      WHERE fighters.id = RankedFighters.id;
    `);

    logger.info("✅ Fighter ranks updated successfully.");
  } catch (error: any) {
    logger.error(`❌ Error updating ranks: ${error.message}`);
  }
};
