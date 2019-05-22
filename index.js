var Service, Characteristic;
var request = require("request");
var pollingtoevent = require('polling-to-event');


module.exports = function(homebridge)
{
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-security-domoticz", "SecuritySystem", SecuritySystem);
};



HttpSprinkler.prototype =
{
  getServices: function ()
	{
    this.securityService = new Service.SecuritySystem(this.name);

	  this.securityService
			.getCharacteristic(Characteristic.SecuritySystemCurrentState)
			.on("get", this.getCurrentState.bind(this));

	  this.securityService
			.getCharacteristic(Characteristic.SecuritySystemTargetState)
			.on("get", this.getTargetState.bind(this))
			.on("set", this.setTargetState.bind(this));

	  return [ this.securityService ];
};
