"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("fights", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "events",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      red_corner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "fighters",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      blue_corner_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "fighters",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      weight_class: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      is_title_fight: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      winner_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "fighters",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      method: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("fights");
  },
};
