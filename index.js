var Service, Characteristic;
var request = require("request");
var pollingtoevent = require('polling-to-event');


module.exports = function(homebridge)
{
	Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-security-domoticz", "HttpSecuritySystem", HttpHeatingSystem);
};


function HttpHeatingSystem(log, config)
{
	this.log = log;

	// Get config info
	this.name		= config.name			|| "HTTP Heating System";

	this.offUrl          		= config.disarmUrl;
	this.awayUrl            = config.awayUrl;
	this.nightUrl           = config.nightUrl;
	this.homeUrl	          = config.homeUrl;
  this.statusUrl          = config.statusUrl;
	this.timeout            = config.timeout            || 5000;
	this.pollingInterval    = config.pollingInterval   	|| 2000;

	this.disarmValue	= config.disarmValue							|| "0";
	this.nightValue		= config.nightValue								|| "10";
	this.awayValue		= config.awayValue								|| "20";
	this.homeValue		= config.awayValue								|| "30";

	this.model 				= config.model 										|| "homebridge-heating";
  this.serial 			= config.serial 									|| "homebridge-heating";

	this.statusOn = false;
	var that = this;

	// Status Polling
	if (this.statusUrl)
	{
		var stateUrl = this.statusUrl;
		var statusemitter = pollingtoevent(function (done)
			{
				that.httpRequest(stateUrl, "", "GET", function (error, response, body)
				{
					if (error)
					{
						that.log('HTTP get status function failed: %s', error.message);
						try
						{
							done(new Error("Network failure that must not stop homebridge!"));
						} catch (err)
						{
							that.log(err.message);
						}
					}
					else
					{
						done(null, body);
					}
			})
		}, { interval: that.pollingInterval, eventName: "statuspoll" });


		statusemitter.on("statuspoll", function (responseBody)
		{
			if (that.disarmValue && that.nightValue && that.awayValue && that.homeUrl)
			{
				var json = JSON.parse(responseBody);
				var status = eval("json.result[0].Level");

				if (status == that.disarmValue)
				{
					//that.log("State is currently: DISARMED");
					that.securityService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
					.updateValue(DISARM);
					that.securityService.getCharacteristic(Characteristic.SecuritySystemTargetState)
					.updateValue(DISARM);
				}

				if (status == that.nightValue)
				{
					//that.log("State is currently: NIGHT");
					that.securityService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
					.updateValue(NIGHT_ARM);
					that.securityService.getCharacteristic(Characteristic.SecuritySystemTargetState)
					.updateValue(NIGHT_ARM);
				}

				if (status == that.awayValue)
				{
					//that.log("State is currently: AWAY");
					that.securityService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
					.updateValue(AWAY_ARM);
					that.securityService.getCharacteristic(Characteristic.SecuritySystemTargetState)
					.updateValue(AWAY_ARM);
				}

				if (status == that.homeValue)
				{
					//that.log("State is currently: AWAY");
					that.securityService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
					.updateValue(STAY_ARM);
					that.securityService.getCharacteristic(Characteristic.SecuritySystemTargetState)
					.updateValue(STAY_ARM);
				}
		}

	});
	}
}


HttpSecuritySystem.prototype =
{

httpRequest: function (url, body, method, callback)
{
	var callbackMethod = callback;

	request({
		url: url,
		body: body,
		method: method,
		timeout: this.timeout,
		rejectUnauthorized: false
		},

		function (error, response, responseBody)
		{
			if (callbackMethod)
			{
				callbackMethod(error, response, responseBody)
			}
			else
			{
				//this.log("callbackMethod not defined!");
			}
		})
},

getCurrentState: function(callback)
{
	var state;

	this.httpRequest(this.statusUrl, "", "GET", function (error, response, body)
	{
		if (error)
		{
			that.log("HTTP setTargetState function failed %s", error.message);
		}
		else
		{
			var json = JSON.parse(body);
			var status = eval("json.result[0].Level");

			if (status == this.disarmValue) { state = 3; }
			if (status == this.nightValue)  { state = 2; }
			if (status == this.homeValue)   { state = 1; }
			if (status == this.awayValue)   { state = 0; }

			callback(error, state);
		}
	}.bind(this));
},


getTargetState: function(callback)
{
	var state;

	this.httpRequest(this.statusUrl, "", "GET", function (error, response, body)
	{
		if (error)
		{
			that.log("HTTP setTargetState function failed %s", error.message);
		}
		else
		{
			var json = JSON.parse(body);
			var status = eval("json.result[0].Level");

			if (status == this.disarmValue) { state = 3; }
			if (status == this.nightValue)  { state = 2; }
			if (status == this.homeValue)   { state = 1; }
			if (status == this.awayValue)   { state = 0; }

			callback(error, state);
		}
	}.bind(this));
},


setTargetState: function(state, callback)
{
	var url = null;
	var body;
	var newState;

	switch (state) {
		case Characteristic.SecuritySystemTargetState.DISARM:
			url = this.offmUrl;
			newState = 3;
			break;
		case Characteristic.SecuritySystemTargetState.NIGHT_ARM:
			url = this.nightUrl;
			newState = 2;
			break;
		case Characteristic.SecuritySystemTargetState.STAY_ARM:
				url = this.stayUrl;
				newState = 1;
				break;
		case Characteristic.SecuritySystemTargetState.AWAY_ARM:
			url = this.awayUrl;
			newState = 0;
			break;
	}

	this.httpRequest(url, "", "GET", function (error, response, body)
		{
			if (error)
			{
				that.log("HTTP setTargetState function failed %s", error.message);
			}
			else
			{
				callback(error, state);
				this.securityService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
				.setValue(state);
			}
		}.bind(this))
},


getServices: function ()
{
	var that = this;

	this.informationService = new Service.AccessoryInformation();

    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, 'goedh452')
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
			.setCharacteristic(Characteristic.FirmwareRevision, '0.1.0');

    this.securityService = new Service.SecuritySystem(this.name);

	this.securityService
		.getCharacteristic(Characteristic.SecuritySystemCurrentState)
		.on("get", this.getCurrentState.bind(this));

	this.securityService
		.getCharacteristic(Characteristic.SecuritySystemTargetState)
		.on("get", this.getTargetState.bind(this))
		.on("set", this.setTargetState.bind(this));

	 return [this.securityService, this.informationService];
}
};
