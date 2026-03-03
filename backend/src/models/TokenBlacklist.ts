import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";

class TokenBlacklist extends Model {
    public id!: number;
    public token!: string;
    public expires_at!: Date;
}

TokenBlacklist.init(
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        token: { type: DataTypes.TEXT, allowNull: false, unique: true },
        expires_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
        sequelize,
        modelName: "TokenBlacklist",
        tableName: "token_blacklist",
        timestamps: true,
    }
);

export default TokenBlacklist;
