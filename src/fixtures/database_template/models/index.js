const UserModel = require("./UserModel");
const TokenModel = require("./TokenModel");
const WeatherModel = require("./WeatherModel");
const PresenceModel = require("./PresenceModel");



module.exports = {
	User: UserModel,
	Token: TokenModel,
	Weather: WeatherModel,
	Presence: PresenceModel
};
