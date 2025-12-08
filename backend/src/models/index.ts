import User from "./User";
import Fighter from "./Fighter";
import Sponsor from "./Sponsor";
import Donor from "./Donor";
import Message from "./Message";

export function initAssociations() {
  // --- Fighter ---
  User.hasOne(Fighter, { foreignKey: "user_id" });
  Fighter.belongsTo(User, { foreignKey: "user_id" });

  // --- Sponsor ---
  User.hasOne(Sponsor, { foreignKey: "user_id" });
  Sponsor.belongsTo(User, { foreignKey: "user_id" });

  // --- Donor ---
  User.hasOne(Donor, { foreignKey: "user_id" });
  Donor.belongsTo(User, { foreignKey: "user_id" });

  // --- Messages ---

  User.hasMany(Message, {
    foreignKey: "senderId",
    as: "sentMessages",
  });

  Message.belongsTo(User, {
    foreignKey: "senderId",
    as: "sender",
  });

  User.hasMany(Message, {
    foreignKey: "receiverId",
    as: "receivedMessages",
  });

  Message.belongsTo(User, {
    foreignKey: "receiverId",
    as: "receiver",
  });
}
