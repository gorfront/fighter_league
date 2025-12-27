import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import Division from "./Division";

class Fighter extends Model {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public country!: string;
  public division_id!: number;
  public division!: string;
  public weight!: number;
  public gender!: "male" | "female";
  public wins!: number;
  public losses!: number;
  public draws!: number;
  public image!: string;
  public bio!: string;
  public achievements!: string[];
  public sponsors!: string[];
  public status!: "pending" | "verified";
  public ranking!: number;
}

Fighter.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    country: { type: DataTypes.STRING(100), allowNull: false },
    division_id: { type: DataTypes.INTEGER, allowNull: false },
    division: { type: DataTypes.STRING(255), allowNull: false },
    weight: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
    gender: { type: DataTypes.STRING(10), allowNull: false },
    wins: { type: DataTypes.INTEGER, defaultValue: 0 },
    losses: { type: DataTypes.INTEGER, defaultValue: 0 },
    draws: { type: DataTypes.INTEGER, defaultValue: 0 },
    image: { type: DataTypes.STRING(255), allowNull: false },
    bio: { type: DataTypes.TEXT },
    achievements: { type: DataTypes.JSONB, defaultValue: [] },
    sponsors: { type: DataTypes.JSONB, defaultValue: [] },
    status: { type: DataTypes.STRING(10), defaultValue: "pending" },
    ranking: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: "Fighter",
    tableName: "fighters",
    timestamps: false,
  }
);

Fighter.belongsTo(Division, { foreignKey: "division_id" });

export default Fighter;
