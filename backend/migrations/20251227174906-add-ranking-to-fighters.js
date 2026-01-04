"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn("fighters", "ranking", {
    //   type: Sequelize.INTEGER,
    //   allowNull: true,
    //   defaultValue: 0,
    // });
    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("fighters", "ranking");
  },
};
