"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("fighters", "knockouts", {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });
    await queryInterface.addColumn("fighters", "age", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("fighters", "height", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn("fighters", "reach", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("fighters", "knockouts");
    await queryInterface.removeColumn("fighters", "age");
    await queryInterface.removeColumn("fighters", "height");
    await queryInterface.removeColumn("fighters", "reach");
  },
};
