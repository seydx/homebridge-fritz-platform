# Fritz!Box Switch Accessory

This plugin uses the TR 064 interface of the router to communicate with it. Host can be the local address (fritz.box) or ip adresse or the myfritz adress (for remote login). Port is 49000 (or port setted in the settings for remote login). So that the plugin runs perfectly, please enter the access data from FritzBox web interface in the config.json. Timeout defines the maximum time a request can take (in seconds). Polling is the time span when the data should be refreshed. Type is required if you are using cable router like Fritz!Box 6490 etc. In this case, you need to put "type":"cable" in the config.json



## Example Config

```
"devices": {
  "FRITZ!Box 7590": {
    "active": true,
    "host": "192.168.178.1",
    "port": 49000,
    "username": "MyUsername",
    "password": "mypw123",
    "type": "dsl",
    "master": true,
    "mesh": true,
    "readOnly": false,
    "beta": false,
    "options": {
      "wifi2": false,
      "wifi5": false,
      "wifiGuest": false,
      "phoneBook": false,
      "wps": false,
      "aw": false,
      "deflection": false,
      "led": false,
      "lock": false
    }
  }
}
```



## Main Parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| name | Unique name for the accessory, eg FritzBox | x |
| master | True if it is your main device/router, false if it is a repeater or extended router | x |
| host       | Host, IP or Remote addresse of the device                    | x |
| port       | Port of the device (Default: 49000, or port setted in the settings for remote login) |  |
| type       | Type of the device (Choices: cable/dsl/repeater - Default: "dsl") |  |
| username   | Username for logging in to the above device                  | x |
| password | Password for logging in to the above device | x |
| readOnly | If true, the device switches will not trigger anymore if on/off (Default: false) | |
| mesh | If you are using the MESH function (7590) set it to true, false otherwise (Default: false) |
| beta | If you are using beta firmware, set it to true, false otherwise (Default: false) |

## Options

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



## Remote Settings

![Remote Settings](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/remoteLogin.jpg)



## Screenshots

![EVE 1](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics1.PNG)

![EVE 2](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics2.PNG)
