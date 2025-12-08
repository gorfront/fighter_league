"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("divisions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      gender: {
        type: Sequelize.STRING(6),
        allowNull: false,
      },

      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      min_weight: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },

      max_weight: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("divisions");
  },
};
