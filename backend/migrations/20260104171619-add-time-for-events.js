"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. SKIP creating the column because it already exists.
    // await queryInterface.addColumn('events', 'started_time', { ... });

    // 2. Just update the existing records to '9:30pm'
    await queryInterface.bulkUpdate(
      "events",
      { started_time: "9:30pm" },
      { started_time: null } // Safety check: only update if currently empty
    );
  },

  async down(queryInterface, Sequelize) {
    // We can leave this here in case you ever want to undo the whole thing
    await queryInterface.removeColumn("events", "started_time");
  },
};
