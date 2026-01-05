import { DataTypes, Model } from "sequelize";
import Fighter from "./Fighter";
import Event from "./Event";
import sequelize from "../config/sequelize";

class Fight extends Model {
  public id!: number;
  public event_id!: number;
  public red_corner_id!: number;
  public blue_corner_id!: number;
  public weight_class!: string;
  public is_title_fight!: boolean;
  public winner_id?: number;
  public method?: string;
  public order_index?: number;
  public round?: number; // Added to init below
  public time?: string; // Added to init below

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Fight.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "events", key: "id" }, // Changed 'Event' to string 'events' to prevent circular dependency issues
    },
    red_corner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "fighters", key: "id" },
    },
    blue_corner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "fighters", key: "id" },
    },
    weight_class: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_title_fight: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    winner_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // 🔥 ADDED THESE TWO SO YOU CAN SAVE RESULTS
    round: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    order_index: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: "fights",
  }
);

// Associations
Fight.belongsTo(Event, { foreignKey: "event_id" });
Fight.belongsTo(Fighter, { as: "redCorner", foreignKey: "red_corner_id" });
Fight.belongsTo(Fighter, { as: "blueCorner", foreignKey: "blue_corner_id" });
Fight.belongsTo(Fighter, { as: "winner", foreignKey: "winner_id" }); // Useful for results

export default Fight;
