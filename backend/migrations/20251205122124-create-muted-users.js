"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("muted_users", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      muted_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addConstraint("muted_users", {
      fields: ["user_id", "muted_user_id"],
      type: "unique",
      name: "unique_mute_pair",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("muted_users");
  },
};
