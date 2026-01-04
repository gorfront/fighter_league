"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable("events");
    if (!tableInfo.finished_time) {
      await queryInterface.addColumn("events", "finished_time", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("events", "finished_time");
  },
};
