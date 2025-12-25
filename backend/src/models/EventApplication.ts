import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import Event from "./Event";
import User from "./User";
import Fighter from "./Fighter";

class EventApplication extends Model {
  public id!: number;
  public event_id!: number;
  public user_id!: number;
  public status!: string;
  public readonly createdAt!: Date;
}

EventApplication.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Event, key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    tableName: "event_applications",
  }
);

EventApplication.belongsTo(Event, { foreignKey: "event_id" });
EventApplication.belongsTo(User, { foreignKey: "user_id" });

User.hasOne(Fighter, { foreignKey: "user_id" });
Fighter.belongsTo(User, { foreignKey: "user_id" });

export default EventApplication;
