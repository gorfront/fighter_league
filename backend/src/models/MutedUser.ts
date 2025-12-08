import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class MutedUser extends Model {
  public id!: number;
  public userId!: number;
  public mutedUserId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MutedUser.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: { model: "users", key: "id" },
      comment: "ID of user who muted another user",
    },
    mutedUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "muted_user_id",
      references: { model: "users", key: "id" },
      comment: "ID of user who is muted",
    },
  },
  {
    sequelize,
    modelName: "MutedUser",
    tableName: "muted_users",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "muted_user_id"],
        name: "unique_mute_pair",
      },
    ],
  }
);

export default MutedUser;
