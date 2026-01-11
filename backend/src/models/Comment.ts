import { DataTypes, Model } from "sequelize";
import sequelize from "../config/sequelize";
import User from "./User";
import Fight from "./Fight";

class Comment extends Model {
    public id!: number;
    public fight_id!: number;
    public user_id!: number;
    public content!: string;
    public readonly created_at!: Date;
}

Comment.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        fight_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "fights", key: "id" },
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "users", key: "id" },
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: "created_at"
        }
    },
    {
        sequelize,
        tableName: "comments",
        timestamps: false, // We handle created_at manually/via defaultValue if needed, but usually timestamps: true gives createdAt/updatedAt. 
        // Looking at User.ts, it has timestamps: false and manual created_at. I will follow that pattern or use timestamps: true if I want both.
        // User.ts has: createdAt: { type: DataTypes.DATE, field: "created_at" } and timestamps: false.
        // I will follow User.ts pattern.
    }
);

export default Comment;
