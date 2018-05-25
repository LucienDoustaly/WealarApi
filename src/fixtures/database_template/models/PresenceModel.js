"use strict";

const Sequelize = require("sequelize");

// For more information about Sequelize Data Types :
// http://docs.sequelizejs.com/manual/tutorial/models-definition.html#data-types



module.exports = {
	name: "presence_info",
	define: {
		id: { // id must always exist
			type: Sequelize.UUID, // Uses uuidv4 by default (default value is recommended)
			primaryKey: true,
			defaultValue: Sequelize.UUIDV4
		},

		wealarId: {
			type: Sequelize.UUID,
			allowNull: false
		},

		activated: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},

		new: {
			type: Sequelize.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},

		presence: {
			type: Sequelize.JSON,
			allowNull: false
		}
	},
	options: {
		timestamps: false
	}
};
