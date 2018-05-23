"use strict";

const uuidv4 = require('uuid/v4');
const passwordHash = require('password-hash');
const { MoleculerError } 	= require("moleculer").Errors;
const Database = require("../adapters/Database");
const Request = require("../mixins/request.mixin");
const CodeTypes = require("../fixtures/error.codes");

// Filters applied when searching for entities
// Elements correspond to the columns of the table
const Filters_Users = {
	role: ["id", "role"],
	infos: ["id", "username", "role", "phone", "preferences"]
};
const Filters_Tokens = {
	empty: ["id"]
};

const Roles = ["ADMIN", "USER"];

const Default_Preferences = {
	securityMode: 0,
	smsNotification: false,
	weatherNotification: false,
	presenceNotification: false
};



module.exports = {
	name: "users",

	mixins: [ Request ],

	actions: {

		create: {
			params: {
				password: "string"
			},
			handler(ctx) {
				return this.generateHash(ctx.params.password)
					.then( (res) => {
						var wealar_id = uuidv4();
						
						return this.DB_Users.insert(ctx, {
							id: wealar_id,
							username: wealar_id,
							password: res.data,
							preferences: Default_Preferences
						});
					})
					.then( () => this.requestSuccess("User Account Created", ctx.params.username) )
					.catch( (err) => this.requestError(CodeTypes.UNKOWN_ERROR));
			}
		},

		getAll: {
			params: {

			},
			handler(ctx) {
				return this.verifyIfAdmin(ctx)
					.then( () => this.DB_Users.find(ctx, { }) )
					.then( (res) => this.requestSuccess("Search Complete", res.data) )
					.catch( (err) => {
						if (err.name === 'Nothing Found')
							return this.requestError(CodeTypes.USERS_NOTHING_FOUND);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		get: {
			params: {
				
			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => this.DB_Users.findById(ctx, {
						id: ctx.meta.user.id,
						filter: Filters_Users.infos
					}))
					.then( (res) => this.requestSuccess("Search Complete", res.data) )
					.catch( (err) => {
						if (err.name === 'Nothing Found')
							return this.requestError(CodeTypes.USERS_NOTHING_FOUND);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		count: {
			params: {

			},
			handler(ctx) {
				return this.verifyIfAdmin(ctx)
					.then( () => this.DB_Users.count(ctx, { }) )
					.then( (res) => this.requestSuccess("Count Complete", res.data) )
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		changeInformation: {
			params: {
				username: "string",
				phone: "string"
			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => this.DB_Users.updateById(ctx, ctx.meta.user.id, {
						username: ctx.params.username,
						phone: ctx.params.phone
					}))
					.then( (res) => this.requestSuccess("Changes Saved", true) )
					.catch( (err) => {
						if (err.name === 'Database Error' && Array.isArray(err.data)){
							if (err.data[0].type === 'unique' && err.data[0].field === 'username')
								return this.requestError(CodeTypes.USERS_USERNAME_CONSTRAINT);
						}

						return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		firstCo: {
			params: {
				username: "string",
				phone: "string",
				oldPassword: "string",
				newPassword: "string"
			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => ctx.call("auth.verifyPassword", { username: ctx.meta.user.username, password: ctx.params.oldPassword}))
					.then( () => this.generateHash(ctx.params.newPassword) )
					.then( (res) => this.DB_Users.updateById(ctx, ctx.meta.user.id, {
						username: ctx.params.username,
						phone: ctx.params.phone,
						password: res.data
					}))
					.then( (res) => this.requestSuccess("Changes Saved", true) )
					.catch( (err) => {
						if (err.name === 'Database Error' && Array.isArray(err.data)){
							if (err.data[0].type === 'unique' && err.data[0].field === 'username')
								return this.requestError(CodeTypes.USERS_USERNAME_CONSTRAINT);
						}

						return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		changePreferences: {
			params: {
				securityMode: "number",
				smsNotification: "boolean",
				weatherNotification: "boolean",
				presenceNotification: "boolean"
			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => {
						if ((ctx.params.securityMode >= 0) && (ctx.params.securityMode < 3))
							return this.requestSuccess("Security Mode Valid", true);
						else
							return this.requestError(CodeTypes.USERS_MODE_CONSTRAINT);
					})
					.then( () => this.DB_Users.updateById(ctx, ctx.meta.user.id, {
						preferences: {
							securityMode: ctx.params.securityMode,
							smsNotification: ctx.params.smsNotification,
							weatherNotification: ctx.params.weatherNotification,
							presenceNotification: ctx.params.presenceNotification
						}
					}))
					.then( (res) => this.requestSuccess("Changes Saved", true) )
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		changePassword: {
			params: {
				oldPassword: "string",
				newPassword: "string"
			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => ctx.call("auth.verifyPassword", { username: ctx.meta.user.username, password: ctx.params.oldPassword}))
					.then( () => this.generateHash(ctx.params.newPassword) )
					.then( (res) => this.DB_Users.updateById(ctx, ctx.meta.user.id, {
						password: res.data
					}))
					//.then( () => ctx.call("auth.closeAllSessions"))
					.then( () => this.requestSuccess("Changes Saved", true) )
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		changeRole: {
			params: {
				username: "string",
				role: "string"
			},
			handler(ctx) {
				return this.verifyIfAdmin(ctx)
					.then( () => this.verifyRole(ctx.params.role) )
					.then( () => {
						if ((ctx.meta.user.username === ctx.params.username) && (ctx.params.role !== "ADMIN"))
							return this.isLastAdmin(ctx)
								.then( (res) => {
									if (res.data === false)
										return Promise.resolve(true);
									else
										return this.requestError(CodeTypes.USERS_FORBIDDEN_REMOVE);
								});
						else
							return Promise.resolve(true);
					})
					.then( () => this.DB_Users.findOne(ctx, {
						query: {
							username: ctx.params.username
						},
						filter: Filters_Users.role
					}))
					.then( (res) => this.DB_Tokens.removeMany(ctx, {
						userId: res.data.id
					}))
					.then( () => this.DB_Users.updateMany(ctx, {
						username: ctx.params.username
					}, {
						role: ctx.params.role
					}))
					.then( () => this.requestSuccess("Changes Saved", true) )
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		remove: {
			params: {
				password: "string"
			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => this.isLastAdmin(ctx) )
					.then( (res) => {
						if (res.data === false)
							return Promise.resolve(true);
						else
							return this.requestError(CodeTypes.USERS_FORBIDDEN_REMOVE);
					})
					.then( () => ctx.call("auth.verifyPassword", { username: ctx.meta.user.username, password: ctx.params.password}))
					.then( () => ctx.call("auth.closeAllSessions") )
					.then( () => this.DB_Users.removeById(ctx, ctx.meta.user.id))
					.then( () => this.requestSuccess("Delete Complete", true) )
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		banish: {
			params: {
				username: "string"
			},
			handler(ctx) {
				return this.verifyIfAdmin(ctx)
					.then( () => this.DB_Users.findOne(ctx, {
						query: {
							username: ctx.params.username
						},
						filter: Filters_Users.role
					}))
					.then( (res) => {
						if (res.data.role !== "ADMIN")
							return this.DB_Tokens.removeMany(ctx, {
									userId: res.data.id
								})
								.then( () => this.DB_Users.removeMany(ctx, {
									username: ctx.params.username
								}));
						else
							return this.requestError(CodeTypes.USERS_FORBIDDEN_REMOVE);
					})
					.then( () => this.requestSuccess("Delete Complete", true) )
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else if (err.name === 'Nothing Found')
							return this.requestError(CodeTypes.USERS_NOTHING_FOUND);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		removeAll: {
			params: {
				password: "string"
			},
			handler(ctx) {
				return this.verifyIfAdmin(ctx)
					.then( () => ctx.call("auth.verifyPassword", { username: ctx.meta.user.username, password: ctx.params.password}))
					.then( () => this.DB_Tokens.removeAll(ctx) )
					.then( () => this.DB_Users.removeAll(ctx) )
					.then( () => ctx.call("users.createAdminIfNotExists"))
					.then( () => this.requestSuccess("Delete Complete", true) )
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		createAdminIfNotExists: {
			params: {

			},
			handler(ctx) {
				return this.DB_Users.count(ctx, {
						role: "ADMIN"
					})
					.then( (res) => {
						if (res.data === 0) {
							var wealar_id = uuidv4();

							return this.generateHash("admin")
								.then( (res) => this.DB_Users.insert(ctx, {
									username: "admin",
									password: res.data,
									role: "ADMIN",
									preferences: Default_Preferences
								}));
						}
						else
							return Promise.resolve(true);
					})
					.then( () => this.requestSuccess("Admin Exists", true) )
					.catch( (err) => this.requestError(CodeTypes.UNKOWN_ERROR) );
			}
		}

	},

	methods: {

		generateHash(value){
			return Promise.resolve(passwordHash.generate(value, {algorithm: 'sha256'}))
				.then( (res) => this.requestSuccess("Password Encrypted", res) );
		},

		verifyIfLogged(ctx){
			if (ctx.meta.user !== undefined)
				return this.requestSuccess("User Logged", true);
			else
				return this.requestError(CodeTypes.USERS_NOT_LOGGED_ERROR);
		},

		verifyIfAdmin(ctx){
			return this.verifyIfLogged(ctx)
				.then( () => {
					if (ctx.meta.user.role === "ADMIN")
						return this.requestSuccess("User is ADMIN", true);
					else
						return this.requestError(CodeTypes.AUTH_ADMIN_RESTRICTION);
				});
		},

		verifyRole(role){
			if (Roles.indexOf(role) !== -1)
				return this.requestSuccess("Role Exists", true);
			else
				return this.requestError(CodeTypes.USERS_INVALID_ROLE);
		},

		isLastAdmin(ctx){
			return this.verifyIfAdmin(ctx)
				.then( () => this.DB_Users.count(ctx, {
					role: "ADMIN"
				}))
				.then( (res) => {
					if (res.data === 1)
						return this.requestSuccess("Last Admin", true);
					else
						return this.requestSuccess("Last Admin", false);
				})
				.catch( (err) => {
					if (err.message === CodeTypes.AUTH_ADMIN_RESTRICTION)
						return this.requestSuccess("Last Admin", false);
					else
						return Promise.reject(err);
				});
		}

	},

	created() {
		this.DB_Users = new Database("User", Filters_Users.infos);
		this.DB_Tokens = new Database("Token", Filters_Tokens.empty);
	}
};
