"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if you are using addColumn correctly
    await queryInterface.addColumn("events", "started_time", {
      type: Sequelize.STRING, // or Sequelize.TIME / Sequelize.DATE
      allowNull: true,
    });

    await queryInterface.addColumn("events", "finished_time", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("events", "started_time");
    await queryInterface.removeColumn("events", "finished_time");
  },
};
