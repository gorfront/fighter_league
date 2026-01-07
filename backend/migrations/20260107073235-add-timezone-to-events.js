"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("events", "timezone", {
      type: Sequelize.STRING,
      defaultValue: "UTC",
    });
  },

  async down(queryInterface, Sequelize) {
    // 🔥 Always add the reverse command here
    await queryInterface.removeColumn("events", "timezone");
  },
};
