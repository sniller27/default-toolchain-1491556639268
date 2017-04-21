'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var cfenv = require('cfenv');
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
var appEnv = cfenv.getAppEnv();

//test
// var Client = require("ibmiotf");
// var appClientConfig = {
//     "org" : "n4jgo6",
//     "id" : "juho",
//     "domain": "internetofthings.ibmcloud.com",
//     "auth-key" : "a-n4jgo6-7m62kd3nta",
//     "auth-token" : "OI8i@+uEbf&BVb!1!J"
// };
// //authkey og authotken er vidst det samme som apikey og apitoken

// //org på /credentials (samt authkey og auth-token)
// //id?
// //{"org":"n4jgo6","apiKey":"a-n4jgo6-7m62kd3nta","apiToken":"OI8i@+uEbf&BVb!1!J"}

// var appClient = new Client.IotfApplication(appClientConfig);

// // appClient.connect();

// appClient.on("connect", function () {
// //iot phone from Watson
//     appClient.subscribeToDeviceEvents("iot-phone","juho","+","json");

// });
// appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {

//     console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);

//     //åbn logfile via termnial og tjek console.log er tilføjet...evt. cf logs johncena (og evt --recent)
//     //parse payload
//     //get x,y,z from payload
// });



process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var config = null;
var credentials = null;
if (process.env.VCAP_SERVICES) {
	config = JSON.parse(process.env.VCAP_SERVICES);

	var iotService = config['iotf-service'];
	for (var index in iotService) {
		if (iotService[index].name === 'discover-iot-try-service') {
			credentials = iotService[index].credentials;
		}
	}
} else {
	console.log("ERROR: IoT Service was not bound!");
}

var basicConfig = {
	org: credentials.org,
	apiKey: credentials.apiKey,
	apiToken: credentials.apiToken

};

// var basicConfig = {
// 	org: 'n4jgo6',
// 	apiKey: 'a-n4jgo6-7m62kd3nta',
// 	apiToken: 'OI8i@+uEbf&BVb!1!J'
// };

var options = {
	host: 'internetofthings.ibmcloud.com',
	port: 443,
	headers: {
	  'Content-Type': 'application/json'
	},
	auth: basicConfig.apiKey + ':' + basicConfig.apiToken
};

app.get('/credentials', function(req, res) {
	res.json(basicConfig);
});

app.get('/iotServiceLink', function(req, res) {
	var options = {
		host: basicConfig.org + '.internetofthings.ibmcloud.com',
		port: 443,
		headers: {
		  'Content-Type': 'application/json'
		},
		auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
		method: 'GET',
		path: 'api/v0002/'
	}
	var org_req = https.request(options, function(org_res) {
		var str = '';
		org_res.on('data', function(chunk) {
			str += chunk;
		});
		org_res.on('end', function() {
			try {
				var org = JSON.parse(str);
				var url = "https://console.ng.bluemix.net/#/resources/serviceGuid=" + org.bluemix.serviceInstanceGuid + "&orgGuid=" + org.bluemix.organizationGuid + "&spaceGuid=" + org.bluemix.spaceGuid;
				res.json({ url: url });
			} catch (e) { console.log("Something went wrong...", str); res.send(500); }
			console.log("iotServiceLink end: ", str.toString());
		});
	}).on('error', function(e) { console.log("ERROR", e); });
	org_req.end();
});

app.post('/registerDevice', function(req, res) {
	console.log(req.body);
	var deviceId = null, typeId = "iot-phone", password = null;
	if (req.body.deviceId) { deviceId = req.body.deviceId; }
	if (req.body.typeId) { typeId = req.body.typeId; }
	if (req.body.password) { password = req.body.password; }

	var options = {
		host: basicConfig.org + '.internetofthings.ibmcloud.com',
		port: 443,
		headers: {
		  'Content-Type': 'application/json'
		},
		auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
		method: 'POST',
		path: 'api/v0002/device/types'
	}

	var deviceTypeDetails = {
		id: typeId
	}
	console.log(deviceTypeDetails);
	var type_req = https.request(options, function(type_res) {
		var str = '';
		type_res.on('data', function(chunk) {
			str += chunk;
		});
		type_res.on('end', function() {
			console.log("createDeviceType end: ", str.toString());

			var dev_options = {
				host: basicConfig.org + '.internetofthings.ibmcloud.com',
				port: 443,
				headers: {
				  'Content-Type': 'application/json'
				},
				auth: basicConfig.apiKey + ':' + basicConfig.apiToken,
				method: 'POST',
				path: 'api/v0002/device/types/'+typeId+'/devices'
			}

			var deviceDetails = {
				deviceId: deviceId,
				authToken: password
			};
			console.log(deviceDetails);

			var dev_req = https.request(dev_options, function(dev_res) {
				var str = '';
				dev_res.on('data', function(chunk) {
					str += chunk;
				});
				dev_res.on('end', function() {
					console.log("createDevice end: ", str.toString());
					res.send({ result: "Success!" });
				});
			}).on('error', function(e) { console.log("ERROR", e); });
			dev_req.write(JSON.stringify(deviceDetails));
			dev_req.end();
		});
	}).on('error', function(e) { console.log("ERROR", e); });
	type_req.write(JSON.stringify(deviceTypeDetails));
	type_req.end();
});


var Client = require("ibmiotf");
var appClientConfig = {
    "org" : "ym6wq7",
    "id" : "fred",
    "domain": "internetofthings.ibmcloud.com",
    "auth-key" : "a-ym6wq7-ewvfh4fsze",
    "auth-token" : "I)YEGs2B+aO*vBUxfW"
}

var appClient = new Client.IotfApplication(appClientConfig);

appClient.connect();

appClient.on("connect", function () {

    appClient.subscribeToDeviceEvents("iot-phone","fred","+","json");
    console.log("I am connected");

});
appClient.on("deviceEvent", function (deviceType, deviceId, eventType, format, payload) {

    console.log("Device Event from :: "+deviceType+" : "+deviceId+" of event "+eventType+" with payload : "+payload);

    //parse json string to json object
    var obj = JSON.parse(payload);

    //cords
    var xaccel = obj.d.ax;
    var yaccel = obj.d.ay;
    var zaccel = obj.d.az;

    if (xaccel > 1) {
    	console.log('phone up');
    }

    console.log(obj.d.ax + " is catfood");

});


app.listen(appEnv.port, function() {
	console.log("server starting on " + appEnv.url);
});
