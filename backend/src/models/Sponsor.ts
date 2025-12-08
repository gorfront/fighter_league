import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

interface FighterForSponsor {
  id: number;
  name: string;
}

class Sponsor extends Model {
  public id!: number;
  public user_id!: number;
  public company_name!: string;
  public logo_url!: string;
  public description!: string;
  public tier!: "Platinum" | "Gold" | "Silver" | "Bronze" | "Partner";
  public email!: string;
  public password!: string;
  public wallet_address!: string;
  public my_fighters!: FighterForSponsor[];
}

Sponsor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    logo_url: DataTypes.STRING(255),
    description: DataTypes.TEXT,
    tier: {
      type: DataTypes.STRING(10),
      defaultValue: "Partner",
      validate: {
        isIn: [["Platinum", "Gold", "Silver", "Bronze", "Partner"]],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    wallet_address: {
      type: DataTypes.STRING(42),
      unique: true,
    },
    my_fighters: { type: DataTypes.JSONB, defaultValue: [] },
  },
  {
    sequelize,
    modelName: "Sponsor",
    tableName: "sponsors",
    timestamps: false,
  }
);

export default Sponsor;
