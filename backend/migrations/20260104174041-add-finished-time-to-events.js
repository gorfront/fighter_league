"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("events", "finished_time", {
      type: Sequelize.DATE, // Stores full timestamp (e.g. 2025-01-04 22:30:00)
      allowNull: true, // Starts as null
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("events", "finished_time");
  },
};
