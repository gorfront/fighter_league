import { DataTypes, Model, Sequelize } from "sequelize";
import sequelize from "../config/sequelize";

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public user_type!: string;
  public country!: string;
  public avatar!: string | null;
  public readonly created_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "GUEST",
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: false,
    underscored: true,
  }
);

export default User;
