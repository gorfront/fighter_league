"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sponsors", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // Uncomment if it should reference users table:
        // references: { model: "users", key: "id" },
        // onUpdate: "CASCADE",
        // onDelete: "CASCADE",
      },

      company_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      logo_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      tier: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "Partner",
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      wallet_address: {
        type: Sequelize.STRING(42),
        unique: true,
        allowNull: true,
      },

      my_fighters: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sponsors");
  },
};
