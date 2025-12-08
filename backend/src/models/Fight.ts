import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import Event from "./Event";
import Fighter from "./Fighter";

class Fight extends Model {
  public id!: number;
  public event_id!: number;
  public fighter1_id!: number;
  public fighter2_id!: number;
  public winner_id!: number;
  public method!: "KO/TKO" | "Submission" | "Decision" | "Draw";
  public round!: number;
  public fight_date!: Date;
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
      references: {
        model: Event,
        key: "id",
      },
    },
    fighter1_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Fighter,
        key: "id",
      },
    },
    fighter2_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Fighter,
        key: "id",
      },
    },
    winner_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Fighter,
        key: "id",
      },
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [["KO/TKO", "Submission", "Decision", "Draw"]],
      },
    },
    round: {
      type: DataTypes.INTEGER,
    },
    fight_date: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "Fight",
    tableName: "fights",
    timestamps: false,
  }
);

Fight.belongsTo(Event, { foreignKey: "event_id" });
Fight.belongsTo(Fighter, { foreignKey: "fighter1_id" });
Fight.belongsTo(Fighter, { foreignKey: "fighter2_id" });
Fight.belongsTo(Fighter, { foreignKey: "winner_id" });

export default Fight;
