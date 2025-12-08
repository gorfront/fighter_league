import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class Event extends Model {
  public id!: number;
  public title!: string;
  public event_date!: Date;
  public location!: string;
  public division!: string;
  public status!: "upcoming" | "completed" | "live";
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    event_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    division: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      defaultValue: "upcoming",
      validate: {
        isIn: [["upcoming", "completed", "live"]],
      },
    },
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "events",
    timestamps: false, 
  }
);

export default Event;
