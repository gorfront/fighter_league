import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class Division extends Model {
  public id!: number;
  public gender!: "male" | "female";
  public name!: string;
  public min_weight!: number;
  public max_weight!: number;
}

Division.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gender: {
      type: DataTypes.STRING(6),
      allowNull: false,
      validate: {
        isIn: [["male", "female"]],
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    min_weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    max_weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Division",
    tableName: "divisions",
    timestamps: false,
  }
);

export default Division;
