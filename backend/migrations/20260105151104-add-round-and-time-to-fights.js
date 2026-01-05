"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("fights", "round", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("fights", "time", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("fights", "round");
    await queryInterface.removeColumn("fights", "time");
  },
};
