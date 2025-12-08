"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("blocked_users", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      blockerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      blockedId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("blocked_users", ["blockerId", "blockedId"], {
      unique: true,
      name: "blocked_users_blockerId_blockedId_unique",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("blocked_users");
  },
};
