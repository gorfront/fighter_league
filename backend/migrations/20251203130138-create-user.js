"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      wallet_address: {
        type: Sequelize.STRING(42),
        unique: true,
        allowNull: true,
      },

      nonce: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      country: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      is_military: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      email: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: true,
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      user_type: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");
  },
};
