# Fritz!Box Switch Accessory

This plugin uses the TR 064 interface of the router to communicate with it. Host can be the local address (fritz.box) or ip adresse or the myfritz adress (for remote login). Port is 49000 (or port setted in the settings for remote login). So that the plugin runs perfectly, please enter the access data from FritzBox web interface in the config.json. Timeout defines the maximum time a request can take (in seconds). Polling is the time span when the data should be refreshed. Type is required if you are using cable router like Fritz!Box 6490 etc. In this case, you need to put "type":"cable" in the config.json



## Example Config

```
"devices": {
  "FritzBox": {
    "master": true,
    "host": "fritz.box",
    "port": 49000,
    "username": "USERNAME",
    "password": "PASSWORD",
    "type": "dsl",
    "wifi2": true,
    "wifi5": true,
    "wifiGuest": true,
    "phoneBook": true,
    "wps": true,
    "aw": true,
    "deflection": true,
    "led": true,
    "lock": true,
    "beta": true,
    "mesh": false
  }
}
```



## Required parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| master | True if it is your main device/router, false if it is a repeater or extended router | x |
| host       | Host, IP or Remote addresse of the device                    | x |
| port       | Port of the device (Default: 49000, or port setted in the settings for remote login) |  |
| type       | Type of the device (Choices: cable/dsl/repeater - Default: "dsl") |  |
| username   | Username for logging in to the above device                  | x |
| password | Password for logging in to the above device | x |



## Optional parameter

| Attributes | Usage |
|------------|-------|
| wifi2 | Parameter for enable/disable wifi 2.4ghz switch (Default: false) |
| wifi5 | Parameter for enable/disable wifi 5ghz switch (Default: false) |
| wifiGuest | Parameter for enable/disable guest wifi switch (Default: false) |
| wps | Parameter for enable/disable wps switch (Default: false) |
| phoneBook | Parameter for enable/disable phonebook togle, it is used to store the phonebook in persist folder (Default: false) |
| aw | Parameter for enable/disable answering machine switch (Default: false) |
| deflection | Parameter for enable/disable deflection switch (Default: false) |
| led | Parameter for enable/disable LED switch (Default: false) |
| lock | Parameter for enable/disable device lock switch (Default: false) |
| beta | If you are using beta firmware, set it to true, false otherwise (Default: false) |
| mesh | If you are using the MESH function (7590) set it to true, false otherwise (Default: false) |



## Remote Settings

![Remote Settings](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/remoteLogin.jpg)



## Screenshots

![EVE 1](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics1.PNG)

![EVE 2](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics2.PNG)