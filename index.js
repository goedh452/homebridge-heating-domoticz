var Service, Characteristic;
var request = require("request");
var pollingtoevent = require('polling-to-event');


module.exports = function(homebridge)
{
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-security-domoticz", "HttpSecuritySystem", HttpSecuritySystem);
};


function HttpSecuritySystem(log, config)
{
	this.log = log;

	// Get config info
	this.name		= config["name"]		|| "HTTP Security System";

	this.disarmUrl          = config["disarmUrl"];
	this.awayUrl            = config["awayUrl"];
	this.stayUrl            = config["stayUrl"];
  	this.statusUrl          = config["statusUrl"];

  	this.httpMethod         = config["httpMethod"]   	|| "GET";
	this.timeout            = config["timeout"]             || 5000;
	this.pollingInterval    = config["pollingInterval"]   	|| 3000;

	this.jsonPath		= config["jsonPath"];
	this.disarmValue	= config["offValue"]		|| "0";
	this.awayValue		= config["onValue"]		|| "10";
	this.stayValue		= config["offValue"]		|| "20";


	//realtime polling info
	this.statusOn = false;
	var that = this;

	// Status Polling
	if (this.statusUrl)
	{
		var powerurl = this.statusUrl;
		var statusemitter = pollingtoevent(function (done)
			{
			that.httpRequest(powerurl, "", this.httpMethod, function (error, response, body)
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
			if (that.onValue && that.offValue)
			{
				that.log("Additional logging");
				
				var jsonTemp = "{\"POWER2\":\"OFF\"}"
				var pathTemp = "POWER2"
				
				that.log(jsonTemp);
				
				//var json = JSON.parse(responseBody);
				var json = JSON.parse(jsonTemp);
				that.log(json);
				
				//var status = eval("json." + that.jsonPath);
				var status = JSON.parse("json." + pathTemp);
				that.log(status);
				that.log(that.onValue);
				that.log(that.offValue);

				if (status == that.onValue)
				{
					that.log("State is currently: ON");

					that.valveService.getCharacteristic(Characteristic.Active)
					.updateValue(1);

					that.valveService.getCharacteristic(Characteristic.InUse)
					.updateValue(1);
				}

				if (status == that.offValue)
				{
					that.log("State is currently: OFF");

					that.valveService.getCharacteristic(Characteristic.InUse)
					.updateValue(0);

					that.valveService.getCharacteristic(Characteristic.Active)
					.updateValue(0);
				}
			}

		});
	}
}




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
