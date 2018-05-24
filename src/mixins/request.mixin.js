"use strict";

const Promise = require("bluebird");
const { MoleculerError } = require("moleculer").Errors;
const CodeTypes = require("../fixtures/error.codes");


// Common methods for request answer to different services
module.exports = {
	methods: {

		requestSuccess(name, data) {
			return Promise.resolve({
				name: name,
				data: data,
				code: 200
			});
		},

		requestError(codeError) {
			var message, code;

			switch (codeError) {

				// Errors on Users

				case CodeTypes.USERS_NOT_LOGGED_ERROR:
					message = "Action need a logged user";
					code = 401;
					break;

				case CodeTypes.USERS_NOTHING_FOUND:
					message = "WealarId does not exist";
					code = 404;
					break;

				case CodeTypes.USERS_USERNAME_CONSTRAINT:
					message = "Username already used";
					code = 417;
					break;

				case CodeTypes.USERS_MODE_CONSTRAINT:
					message = "Security mode is an integer between 0 and 2";
					code = 417;
					break;

				case CodeTypes.USERS_FORBIDDEN_REMOVE:
					message = "ADMIN User cannot be removed";
					code = 403;
					break;

				case CodeTypes.USERS_INVALID_ROLE:
					message = "Role Unknown";
					code = 417;
					break;

				// Errors on Auth

				case CodeTypes.AUTH_INVALID_CREDENTIALS:
					message = "Wrong password";
					code = 417;
					break;

				case CodeTypes.AUTH_ADMIN_RESTRICTION:
					message = "Action need ADMIN permission";
					code = 401;
					break;

				case CodeTypes.AUTH_ACCESS_DENIED:
					message = "Role invalid for this action";
					code = 401;
					break;

				case CodeTypes.AUTH_INVALID_TOKEN:
					message = "Invalid Token: verification of authentification failed";
					code = 401;
					break;

				case CodeTypes.AUTH_NO_TOKEN:
					message = "Missing Token: a logged User is required for this kind of request";
					code = 401;
					break;

				// Errors on Products

				case CodeTypes.WEATHER_NOTHING_FOUND:
					message = "No weather data collected from the product yet";
					code = 404;
					break;

				case CodeTypes.PRESENCE_NOTHING_FOUND:
					message = "No presence has been detected from the product yet";
					code = 404;
					break;

				// Unknown Error

				default:
					message = "Operation failed internally: unknown details";
					code = 500;
					break;
			}

			return this.Promise.reject(new MoleculerError(codeError, code, "ERR_CRITIAL", { code: code, message: message }));
		}
	}
};
