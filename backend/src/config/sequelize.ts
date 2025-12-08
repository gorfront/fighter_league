import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "valor",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "dev123",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    logging: false,
  }
);

export default sequelize;
