"use strict";

const Sequelize = require("sequelize");

// For more information about Sequelize Data Types :
// http://docs.sequelizejs.com/manual/tutorial/models-definition.html#data-types



module.exports = {
	name: "weather_info",
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

		date: {
			type: Sequelize.STRING(10),
			allowNull: false
		},

		day: {
			type: Sequelize.INTEGER,
			allowNull: false
		},

		weather: {
			type: Sequelize.JSON,
			allowNull: false
		}
	},
	options: {
		timestamps: false
	}
};
