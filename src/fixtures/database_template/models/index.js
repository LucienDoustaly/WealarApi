const UserModel = require("./UserModel");
const TokenModel = require("./TokenModel");
const WeatherModel = require("./WeatherModel");
const AlarmModel = require("./AlarmModel");


module.exports = {
	User: UserModel,
	Token: TokenModel,
	Weather: WeatherModel,
	Alarm: AlarmModel
};
