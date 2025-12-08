"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("events", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      event_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      division: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      status: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: "upcoming",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("events");
  },
};
