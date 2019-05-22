# Presence Occupancy Accessory

If you add new devices (MAC addresse or IP addresse) under 'presence' in the config.json, they will be added to HomeKit as occupancy sensors.

The presence is carried out via WiFi detection. If you connect with the Wlan, the accessory will switch to "occupancy detected", otherwise it switches to "no occupancy"

Presence also supports the Telegram notification service, via config.json it is possible to add your own chatID and add your own notification.



## Example Config

```
"presence": {
  "user": [
    {
      "active": true,
      "name": "User One",
      "address": "192.168.178.59"
    },
    {
      "active": true,
      "name": "User Two",
      "address": "192.168.178.91"
    }
  ],
  "anyone": true,
  "offDelay": 90,
  "onDelay": 15
}
```



## Required parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| name | Own defined name for Home | x |
| active | On/Off for activating accessory | x |
| address | MAC addresse  or IP addresse from the device | x |
| anyone     | If true, the plugin will expose an "Anyone" occupancy sensor to HomeKit (Default: false) |      |
| offDelay      | Delay in seconds before an occupancy sensor will go to "not detected" (Default: 10s) |     |
| onDelay      | Delay in seconds before an occupancy sensor will go to "detected" (Default: false) |     |




# Extended Presence

You can also add a "Anyone" sensor to HomeKit for checking presence at home to create automations based on "if anyone at home / not at home)

There is also a possibility to set two types of delays.

- **offDelay**:  This prevents the occupancy sensor from going to "no occupancy" (in case of if device logs out and immediately logs in and again). Only if there is still no connection in the specified time, the occupancy sensor goes to "no occupancy". If delay = 0 or removed, this option is deactivated. 

- **onDelay**: This prevents the occupancy sensor from going to "occupancy detected" (in case of if device logs in and immediately logs out and again). Only if there is still connection in the specified time, the occupancy sensor goes to "occupancy detected". If onDelay = 0 or removed, this option is deactivated. 

Check the **[General config](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/General.md)** section for this!


## Screenshots

![Overview](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/overview.jpg)
