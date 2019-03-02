# Presence Occupancy Accessory

If you add new devices (MAC addresse or IP addresse) under 'presence' in the config.json, they will be added to HomeKit as occupancy sensors.

The presence is carried out via WiFi detection. If you connect with the Wlan, the accessory will switch to "occupancy detected", otherwise it switches to "no occupancy"

Presence also supports the Telegram notification service, via config.json it is possible to add your own chatID and add your own notification.



## Example Config

```
"presence": {
  "Peter":"00:11:22:33:44.55",
  "Maria":"123.456.123.1"
}
```



## Required parameter

| Attributes | Usage | Req |
|------------|-------|:----------:|
| custom name | Own definef name for Home | x |
| adress | MAC addresse  or IP addresse from the device | x |



# Extended Presence

You can also add a "Anyone" sensor to HomeKit for checking presence at home to create automations based on "if anyone at home / not at home)

There is also a possibility to set a delay. This prevents the occupancy sensor from going to "no occupancy" when the device logs out of the repeater and connects to the router or vice versa. Only if there is still no connection in the specified time, the occupancy sensor goes to "no occupancy". If delay = 0 or removed, this option is deactivated. 

Check the **[General config](https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/config/General.md)** section for this!


## Screenshots

![Overview](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/overview.jpg)
