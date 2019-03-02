# Fritz!Repeater Switch Accessory

Like with the Fritz!Box, this plugin uses the TR 064 interface of the repeater to communicate with it. Port for it is 49000. So that the plugin runs perfectly, please enter the access data to FritzRepeater web interface in the config.json (if you dont hve a usernsme, judt ttake the username from your FritzBox). In addition to the TR064 interface, the plugin also uses the LUA interface for e.g. turn on the LED

The Plugin can also expose all available Wifi frequences and guest wifi access as characteristics to HomeKit. **Note:** Custom characteristics are only available with 3rd party apps like Elgato EVE etc.



## Example Config

```
  "devices": {
    "FritzBox": {
      "host": "fritz.repeater",
      "port": 49000,
      "username": "USERNAME",
      "password": "PASSWORD",
      "type": "repeater",
      "wifi2": true,
      "wifi5": true,
      "wifiGuest": true
      "led": true
    }
  }
```



## Required parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| host | Host, IP or Remote addresse of the device | x |
| port | Port of the device (Default: 49000, or port setted in the settings for remote login) | x |
| type | Type of the device (Choices: repeater/cable/dsl, Default: "dsl") |  |
| username | Username for logging in to the above device | x |
| password | Password for logging in to the above device | x |



## Optional parameter

| Attributes | Usage |
|------------|-------|
| wifi2 | Parameter for enable/disable wifi 2.4ghz switch (Default: false) |
| wifi5 | Parameter for enable/disable wifi 5ghz switch (Default: false) |
| wifiGuest | Parameter for enable/disable guest wifi switch (Default: false) |
| led | Parameter for enable/disable LED switch (Default: false) |



## Screenshots

![EVE 1](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/Repeater.JPG)