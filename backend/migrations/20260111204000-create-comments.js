"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("comments", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            fight_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "fights",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("comments");
    },
};
