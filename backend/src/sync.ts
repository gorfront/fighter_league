import sequelize from "./config/sequelize";

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log("Database synced successfully");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
};

syncDatabase();
