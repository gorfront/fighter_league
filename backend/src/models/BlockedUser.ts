import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class BlockedUser extends Model {
  public id!: number;
  public blockerId!: number;
  public blockedId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BlockedUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    blockerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      comment: "ID users who blocked another user",
    },
    blockedId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      comment: "ID users who are blocked",
    },
  },
  {
    sequelize,
    modelName: "BlockedUser",
    tableName: "blocked_users",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["blockerId", "blockedId"],
      },
    ],
  }
);

export default BlockedUser;
