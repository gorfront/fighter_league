"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fighters", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        // uncomment if linked to users table
        // references: { model: "users", key: "id" },
        // onUpdate: "CASCADE",
        // onDelete: "SET NULL",
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      division_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "divisions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      division: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      weight: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
      },

      gender: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },

      wins: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      losses: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      draws: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      image: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      achievements: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },

      sponsors: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },

      status: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "pending",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("fighters");
  },
};
