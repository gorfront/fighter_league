// import { DataTypes, Model, Optional } from "sequelize";

// import sequelize from "../config/sequelize";

// interface MessageAttributes {
//   id: number;
//   senderId: number;
//   receiverId: number;
//   content: string;
//   isRead: boolean;
//   deletedBySender: boolean;
//   deletedByReceiver: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// interface MessageCreationAttributes
//   extends Optional<
//     MessageAttributes,
//     "id" | "isRead" | "deletedBySender" | "deletedByReceiver"
//   > {}

// class Message
//   extends Model<MessageAttributes, MessageCreationAttributes>
//   implements MessageAttributes
// {
//   public id!: number;
//   public senderId!: number;
//   public receiverId!: number;
//   public content!: string;
//   public isRead!: boolean;
//   public deletedBySender!: boolean;
//   public deletedByReceiver!: boolean;
//   public readonly createdAt!: Date;
//   public readonly updatedAt!: Date;
// }

// Message.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },

//     senderId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: "users", key: "id" },
//     },

//     receiverId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       references: { model: "users", key: "id" },
//     },

//     content: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },

//     isRead: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//     },

//     deletedBySender: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//       allowNull: false,
//     },

//     deletedByReceiver: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//       allowNull: false,
//     },
//   },

//   {
//     sequelize,
//     modelName: "Message",
//     tableName: "messages",
//     timestamps: true,
//   }
// );

// export default Message;

import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/sequelize";

interface MessageAttributes {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  // New Fields
  attachmentUrl?: string;
  attachmentType?: string;

  isRead: boolean;
  deletedBySender: boolean;
  deletedByReceiver: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MessageCreationAttributes
  extends Optional<
    MessageAttributes,
    | "id"
    | "isRead"
    | "deletedBySender"
    | "deletedByReceiver"
    | "attachmentUrl"
    | "attachmentType"
  > {}

class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: number;
  public senderId!: number;
  public receiverId!: number;
  public content!: string;
  // New Fields
  public attachmentUrl!: string;
  public attachmentType!: string;

  public isRead!: boolean;
  public deletedBySender!: boolean;
  public deletedByReceiver!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true, // Allow null if sending only an image
    },
    // Add these columns
    attachmentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachmentType: {
      type: DataTypes.STRING, // 'image' or 'file'
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedBySender: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    deletedByReceiver: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
  }
);

export default Message;
