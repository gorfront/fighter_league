import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface SubscriberAttributes {
  id: number;
  email: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubscriberCreationAttributes
  extends Optional<SubscriberAttributes, "id" | "isActive"> {}

class Subscriber
  extends Model<SubscriberAttributes, SubscriberCreationAttributes>
  implements SubscriberAttributes
{
  public id!: number;
  public email!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subscriber.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Subscriber",
    tableName: "subscribers",
    timestamps: true,
  }
);

export default Subscriber;
