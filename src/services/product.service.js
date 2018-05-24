"use strict";

const jwt	= require("jsonwebtoken");
const passwordHash = require('password-hash');
const { pick } = require("lodash");
const Promise = require("bluebird");
const { MoleculerError } 	= require("moleculer").Errors;
const Database = require("../adapters/Database");
const Request = require("../mixins/request.mixin");
const CodeTypes = require("../fixtures/error.codes");

// Filters applied when searching for entities
// Elements correspond to the columns of the table
const Filters_Weather = {
	infos: ["wealarId", "date", "weather"]
};
const Filters_Presence = {
	empty: ["id"]
};
const Filters_Users = {
	wealarId: ["id"]
};

const Default_Data = {
	data: []
};



module.exports = {
	name: "product",

	mixins: [ Request ],

	actions: {

		addWeather: {
			params: {
				wealarId: "string",
				temperature: "string",
				humidity: "string",
				night: "string"
			},
			handler(ctx) {
				var today = this.getDate();
				var weather = Default_Data;

				return this.verifyWealarId(ctx)
					.then( () => this.DB_Weather.findOne(ctx, {
						query: {
							wealarId: ctx.params.wealarId,
							date: today
						}
					}))
					.then( (res) => {
						weather = res.data.weather;

						return this.requestSuccess("Weather data retreived", res.data.wealarId);
					})
					.catch( (err) => {
						if (err.name === 'Nothing Found')
							return this.DB_Weather.insert(ctx, {
								wealarId: ctx.params.wealarId,
								date: today,
								weather: Default_Data
							})
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					})
					.then( (res) => {
						weather.push({
							hour: this.getTime(),
							infos: {
								temperature: parseInt(ctx.params.temperature, 10),
								humidity: parseInt(ctx.params.humidity, 10),
								night: (ctx.params.night === "1")
							}
						});

						return this.requestSuccess("Weather data formated", true);
					})
					.then( () => this.DB_Weather.removeMany(ctx, {
						wealarId: ctx.params.wealarId,
						date: { $lt: today-6 }
					}))
					.then( () => this.DB_Weather.updateMany(ctx, {
						wealarId: ctx.params.wealarId,
						date: today
					}, {
						weather: weather
					}))
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		addPresence: {
			params: {
				wealarId: "string"
			},
			handler(ctx) {
				var today = this.getDate();
				var presence = Default_Data;

				return this.verifyWealarId(ctx)
					.then( () => this.DB_Presence.findOne(ctx, {
						query: {
							wealarId: ctx.params.wealarId,
							date: today
						}
					}))
					.then( (res) => {
						presence = res.data.presence;

						return this.requestSuccess("Presence data retreived", res.data.wealarId);
					})
					.catch( (err) => {
						if (err.name === 'Nothing Found')
							return this.DB_Presence.insert(ctx, {
								wealarId: ctx.params.wealarId,
								date: today,
								presence: Default_Data
							})
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					})
					.then( (res) => {
						presence.push(this.getTime());

						return this.requestSuccess("Presence data formated", true);
					})
					.then( () => this.DB_Presence.updateMany(ctx, {
						wealarId: ctx.params.wealarId,
						date: today
					}, {
						presence: presence
					}))
					.catch( (err) => {
						if (err instanceof MoleculerError)
							return Promise.reject(err);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		getAllWeather: {
			params: {

			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => this.DB_Weather.find(ctx, {
						query: {
							wealarId: ctx.meta.user.id
						}
					}))
					.then( (res) => this.requestSuccess("Search Complete", res.data) )
					.catch( (err) => {
						if (err.name === 'Nothing Found')
							return this.requestError(CodeTypes.WEATHER_NOTHING_FOUND);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		getAllPresence: {
			params: {

			},
			handler(ctx) {
				return this.verifyIfLogged(ctx)
					.then( () => this.DB_Presence.find(ctx, {
						query: {
							wealarId: ctx.meta.user.id
						}
					}))
					.then( (res) => this.requestSuccess("Search Complete", res.data) )
					.catch( (err) => {
						if (err.name === 'Nothing Found')
							return this.requestError(CodeTypes.PRESENCE_NOTHING_FOUND);
						else
							return this.requestError(CodeTypes.UNKOWN_ERROR);
					});
			}
		},

		postTest:{
			params: {

			},
			handler(ctx) {
				console.log("COUCOU");
				return "Success";
			}
		},

		alarm: {
			params: {
				mode: "string"
			},
			handler(ctx) {
				console.log("\n\nAlarm activated !\nSecurity mode: "+ctx.params.mode+"\n\n");
				return "Request Success";
			}
		},

		off: {
			params: {

			},
			handler(ctx) {
				console.log("\n\nAlarm Off !!!\n\n");
				return "Request Success";
			}
		},

		presence: {
			params: {

			},
			handler(ctx) {
				console.log("\n\nPresence detected !!!\n\n");
				return "Request Success";
			}
		},

		weather: {
			params: {
				temperature: "string",
				humidity: "string",
				night: "string"
			},
			handler(ctx) {
				console.log("\n\nNight: "+((ctx.params.night[0] == '1') ? true : false)+"\nTemperature: "+ctx.params.temperature+"°C\nHumidity: "+ctx.params.humidity+"%\n\n");
				return "Request Success";
			}
		}



	},


	methods: {

		verifyIfLogged(ctx){
			if (ctx.meta.user !== undefined)
				return this.requestSuccess("User Logged", true);
			else
				return this.requestError(CodeTypes.USERS_NOT_LOGGED_ERROR);
		},

		verifyWealarId(ctx){
			return this.DB_Users.findById(ctx, {
					id: ctx.params.wealarId
				})
				.then( () => this.requestSuccess("WealarId correct", true) )
				.catch( (err) => {
					if (err.name === 'Nothing Found')
						return this.requestError(CodeTypes.USERS_NOTHING_FOUND);
					else
						return this.requestError(CodeTypes.UNKOWN_ERROR);
				});
		},

		getDate(){
			return (new Date()).getDate();
		},

		getTime(){
			var date = new Date();

			return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
		}

	},

	created() {
		// Create Promisify encode & verify methods
		this.encode = Promise.promisify(jwt.sign);
		this.verify = Promise.promisify(jwt.verify);

		this.DB_Weather = new Database("Weather", Filters_Weather.infos);
		this.DB_Presence = new Database("Presence");
		this.DB_Users = new Database("User", Filters_Users.wealarId);
	}
};
