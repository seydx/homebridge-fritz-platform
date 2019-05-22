# Fritz!Box Switch Accessory

This plugin uses the TR 064 interface of the router to communicate with it. Host can be the local address (fritz.box) or ip adresse or the myfritz adress (for remote login). Port is 49000 (or port setted in the settings for remote login). So that the plugin runs perfectly, please enter the access data from FritzBox web interface in the config.json. Timeout defines the maximum time a request can take (in seconds). Polling is the time span when the data should be refreshed. Type is required if you are using cable router like Fritz!Box 6490 etc. In this case, you need to put "type":"cable" in the config.json



## Example Config

```
"devices": {
  "FRITZ!Box 7590": {
    "active": false,
    "host": "192.168.178.1",
    "port": 49000,
    "username": "Username123",
    "password": "pw3456",
    "type": "dsl",
    "master": true,
    "mesh": true,
    "readOnly": false,
    "options": {
      "wifi2": [
        true,
        false
      ],
      "wifi5": [
        true,
        false
      ],
      "wifiGuest": [
        true,
        false
      ],
      "reconnect": true,
      "wps": [
        true,
        false
      ],
      "aw": [
        true,
        false
      ],
      "deflection": [
        true,
        false
      ],
      "led": [
        true,
        false
      ],
      "lock": [
        true,
        false
      ]
    }
  }
}
```



## Main Parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| name | Unique name for the accessory, eg FritzBox | x |
| active | Activate/Deactivate Accessory |  |
| master | True if it is your main device/router, false if it is a repeater or extended router | x |
| host       | Host, IP or Remote addresse of the device                    | x |
| port       | Port of the device (Default: 49000, or port setted in the settings for remote login) |  |
| type       | Type of the device (Choices: cable/dsl/repeater - Default: "dsl") |  |
| username   | Username for logging in to the above device                  | x |
| password | Password for logging in to the above device | x |
| readOnly | If true, the device switches will not trigger anymore if on/off (Default: false) | |
| mesh | If you are using the MESH function (7590) set it to true, false otherwise (Default: false) |

## Options - MASTER DEVICE

| Attributes | Usage |
|------------|-------|
| wifi2 | Parameter for enable/disable wifi 2.4ghz switch or expose as extra switch accessory (Default: [false,false]) |
| wifi5 | Parameter for enable/disable wifi 5ghz switch or expose as extra switch accessory (Default: [false,false]) |
| wifiGuest | Parameter for enable/disable guest wifi switch or expose as extra switch accessory (Default: [false,false]) |
| wps | Parameter for enable/disable wps switch or expose as extra switch accessory (Default: [false,false]) |
| aw | Parameter for enable/disable answering machine switch or expose as extra switch accessory (Default: [false,false]) |
| deflection | Parameter for enable/disable deflection switch or expose as extra switch accessory (Default: [false,false]) |
| led | Parameter for enable/disable LED switch or expose as extra switch accessory (Default: [false,false]) |
| lock | Parameter for enable/disable device lock switch or expose as extra switch accessory (Default: [false,false]) |
| reconnect | Parameter for enable/disable reconnect switch (Default: false) |



## Options - OTHER DEVICES

| Attributes | Usage |
|------------|-------|
| wifi2 | Parameter for enable/disable wifi 2.4ghz switch or expose as extra switch accessory (Default: [false,false]) |
| wifi5 | Parameter for enable/disable wifi 5ghz switch or expose as extra switch accessory (Default: [false,false]) |
| wifiGuest | Parameter for enable/disable guest wifi switch or expose as extra switch accessory (Default: [false,false]) |
| wps | Parameter for enable/disable wps switch or expose as extra switch accessory (Default: [false,false]) |
| led | Parameter for enable/disable LED switch or expose as extra switch accessory (Default: [false,false]) |


_Hint: The **first** false/true in an array, ie. "wifi2":[false,false], activates/deactivates a switch characteristic for the main service. The **second** false/true in an array, ie. "wifi2":[false,false], activates/deactivates a switch accessory_

## Remote Settings

![Remote Settings](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/remoteLogin.jpg)



## Screenshots

![EVE 1](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics1.PNG)

![EVE 2](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics2.PNG)
