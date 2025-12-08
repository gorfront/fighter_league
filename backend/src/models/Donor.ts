import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class Donor extends Model {
  public email!: string;
  public password!: string;
  public id!: number;
  public user_id!: number;
  public logo_url!: string;
  public wallet_address!: string;
}

Donor.init(
  {
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    logo_url: {
      type: DataTypes.STRING(255),
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Donor",
    tableName: "donors",
    timestamps: false,
  }
);

export default Donor;
