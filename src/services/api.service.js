"use strict";

const Promise = require("bluebird");
const ApiGateway = require("moleculer-web");
const { MoleculerError } 	= require("moleculer").Errors;
const Request = require("../mixins/request.mixin");
const CodeTypes = require("../fixtures/error.codes");


module.exports = {
	name: "api",

	mixins: [
		ApiGateway,
		Request
	],

	settings: {
		port: process.env.PORT || 9000,

		cors: {
				origin: "*",
				methods: ["GET", /*"PATCH", "OPTIONS",*/ "POST", "PUT", "DELETE"],
				allowedHeaders: ["Content-Type", "Authorization"],
				exposedHeaders: [],
				credentials: false,
				maxAge: 3600
		},

		//path: "/api",

		routes: [

			{
				bodyParsers: {
						json: true,
				},
				path: "/public/",
				authorization: false,
				whitelist: [
					"auth.login",
					"users.create",
					"product.postTest"
				],
				aliases: {
					// Auth: login only
					"POST login": "auth.login",

					// Users: create User account only
					"POST user": "users.create"
				}
			},
			{
				bodyParsers: {
						json: true,
				},
				path: "/wealar/",
				authorization: false,
				whitelist: [
					"product.*"
				],
				aliases: {
					//Test post
					"POST test": "product.postTest",

          "POST alarm/:mode": "greeter.alarm",
          "POST off": "greeter.off",
          "POST presence": "greeter.presence",
          "POST weather/:temperature/:humidity/:night": "greeter.weather"
				}
			},
			{
				bodyParsers: {
						json: true,
				},
				path: "/admin/",
				roles: ["ADMIN"],
				authorization: true,
				whitelist: [
					"users.*"
				],
				aliases: {
					// Users: Actions on Users that needs priviledges
					"GET users/count": "users.count",
					"PUT user/change/role/:username/:role": "users.changeRole",
					"DELETE banish/:username": "users.banish",
					"DELETE users": "users.removeAll",
				}
			},
			{
				bodyParsers: {
						json: true,
				},
				path: "/common/",
				roles: ["ADMIN", "USER"],
				authorization: true,
				whitelist: [
					"auth.countSessions",
					"auth.logout",
					"auth.closeAllSessions",
					"users.getAll",
					"users.get",
					"users.changeInformation",
					"users.firstCo",
					"users.changePreferences",
					"users.changePassword",
					"users.remove"
				],
				aliases: {
					// Auth: Session Controls only
					"GET sessions": "auth.countSessions",
					"DELETE logout": "auth.logout",
					"DELETE sessions": "auth.closeAllSessions",

					// Users: Actions on Users that does not need priviledges
					"GET users": "users.getAll",
					"GET user/:username": "users.get",
					"PUT user/change/infos/firstco": "users.firstCo",
					"PUT user/change/infos/userinfos": "users.changeInformation",
					"PUT user/change/infos/preferences": "users.changePreferences",
					"PUT user/change/password": "users.changePassword",
					"DELETE user": "users.remove",
				}
			}

		]

	},

	methods: {

		authorize(ctx, route, req) {
			var authValue = req.headers["authorization"];

			if (authValue && authValue.startsWith("Bearer ")) {
				var token = authValue.slice(7);

				return ctx.call("auth.verifyToken", { token })
					.then( (decoded) => {
						if (route.opts.roles.indexOf(decoded.role) === -1)
							return this.requestError(CodeTypes.AUTH_ACCESS_DENIED);

						ctx.meta.user = decoded;
						ctx.meta.user.token = token;
					})
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);

						return this.requestError(CodeTypes.AUTH_INVALID_TOKEN);
					});

			} else
				return this.requestError(CodeTypes.AUTH_NO_TOKEN);
		}

	}
};
