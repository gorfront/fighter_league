"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("donors", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // uncomment this if it references Users table
        // references: { model: "users", key: "id" },
        // onUpdate: "CASCADE",
        // onDelete: "CASCADE",
      },

      logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      wallet_address: {
        type: Sequelize.STRING(42),
        unique: true,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("donors");
  },
};
