# Configuring - First Steps

After enabling TR064 ([Enable TR064 API](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/Installation.md)) the next step will be generating the config.json


After installing this plugin, you need only put following in your config.json


## 1a. Init (enabled auto device search)

This version of config.json uses "auto device search". So it will search your network for all compatible devices and put it automatically into your config.json. If you have issues with this method, please try **1b**

```
{
  "bridge": {
    ...
  },
  "accessories": [
    ...
  ],
  "platforms": [
    {
      "platform": "FritzPlatform",
    }
  ]
}
```


## 1b. Init (disabled auto device search)

If you running issues with the first method, try with disabling auto search. This will look for devices setted up in your config.json and complete automatically the rest. You need atleast an **unique** name for the device and the ip address of the device. If you have another port than 49000 you need to put it also in config.json, otherwise you can skip port.

```
{
  "bridge": {
    ...
  },
  "accessories": [
    ...
  ],
  "platforms": [
    {
      "platform": "FritzPlatform",
      "disableAutoSearch": true,
      "devices":{
        "FritzBox Name Here": {
          "host": "192.168.178.1",
          "port": 49000
        },
        "Another FritzBox Name Here if needed": {
          "host": "192.168.178.2",
          "port": 49000
        }
      }
    }
  ]
}
```

...and restart homebridge

## 2. First Start

After putting the above code in your config.json and restarting homebridge, the plugin will initalize the config and search for all devices in your network. After search is finished, the plugin will generate a first config.json without any credentials etc, thats looks like following:

```
{
  "bridge": {
    ...
  },
  "accessories": [
    ...
  ],
  "platforms": [
    {
      "platform": "FritzPlatform",
      "devices": {
        "FRITZ!Box 7590": {
          "active": false,
          "host": "192.168.178.1",
          "port": 49000,
          "username": "",
          "password": "",
          "type": "",
          "master": false,
          "mesh": false,
          "readOnly": false,
          "beta": false,
          "options": false
        },
        "FRITZ!Box 7430 BU": {
          "active": false,
          "host": "192.168.178.82",
          "port": 49000,
          "username": "",
          "password": "",
          "type": "",
          "master": false,
          "mesh": false,
          "readOnly": false,
          "beta": false,
          "options": false
        },
        "FRITZ!WLAN Repeater 310": {
          "active": false,
          "host": "192.168.178.66",
          "port": 49000,
          "username": "",
          "password": "",
          "type": "",
          "master": false,
          "mesh": false,
          "readOnly": false,
          "beta": false,
          "options": false
        }
      },
      "smarthome": {
        "Test Contact Sensor": {
          "active": false,
          "ain": "01234567890",
          "devType": "contact"
        },
        "Test Thermostat Device": {
          "active": false,
          "ain": "01234567890",
          "heatValue": 5,
          "coolValue": 5,
          "windowSensor": false,
          "devType": "thermostat"
        },
        "Test Outlet Device": {
          "active": false,
          "ain": "01234567890",
          "tempSensor": false,
          "devType": "switch"
        }
      },
      "callmonitor": {
        "active": false,
        "ip": "0.0.0.0",
        "port": 1012,
        "country": "",
        "incomingTo": "",
        "outgoingFrom": []
      },
      "presence": {
        "user": [
          {
            "active": false,
            "name": "Test User",
            "address": "0.0.0.0"
          }
        ],
        "anyone": false,
        "offDelay": 90,
        "onDelay": 15
      },
      "wol": [
        {
          "active": false,
          "name": "Test Device",
          "address": "00:00:00:00:00:00"
        }
      ],
      "alarm": {
        "active": false,
        "telNr": "",
        "duration": 30
      },
      "wakeup": {
        "active": false,
        "internNr": "",
        "duration": 30
      },
      "ringlock": {
        "active": false,
        "DECTphones": 1,
        "start": "11:00",
        "end": "22:00"
      },
      "broadband": {
        "active": false,
        "measureTime": 5
      },
      "extReboot": {
        "active": false,
        "cmdOn": "",
        "cmdOff": ""
      },
      "telegram": {
        "active": false,
        "token": "",
        "chatID": "",
        "presence": {
          "in": "",
          "out": "",
          "anyoneIn": "",
          "anyoneOut": ""
        },
        "callmonitor": {
          "incoming": "",
          "disconnected": ""
        },
        "alarm": {
          "activated": "",
          "deactivated": ""
        },
        "extReboot": {
          "start": "",
          "finish": ""
        }
      },
      "polling": 10,
      "timeout": 10,
      "clearCache": false
    }
  ]
}

```

## 2. Second Start

After first start, you need to open your generated config.json and add your credentials to the founded devices AND you need to choose ONE "master" device. 
Type is also recommended! (dsl|cable|repeater)

After setting up the generated config.json (with credentials, master and type), restart homebridge again. 
The plugin will complete the config process and you will have a full config.json

See [Example Config](https://github.com/SeydX/homebridge-fritz-platform/blob/dev/example/example-config.json)

Now you can activate/deactivate devices you want to see in HomeKit and set up extras etc and/or change options 
