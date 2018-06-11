# Presence

If you add new devices (MAC addresse or IP addresse) under 'presence.devices' in the config.json, they will be added to HomeKit as motion sensors with FakeGato support.

The presence is carried out via WiFi detection. If you connect with the Wlan, the accessory will switch to "motion detected", otherwise it switches to "no motion"

You can also add a "Anyone" sensor to HomeKit for checking presence at home to create automations based on "if anyone at home / not at home)

There is also a possibility to set a delay. This prevents the motion sensor from going to "no movement" when the device logs out of the repeater and connects to the router or vice versa. Only if there is still no connection in the specified time, the motion sensor goes to "no movement". If delay = 0 or removed, this option is deactivated. Type defines the accessory type (motion sensor or occupancy sensor)

Presence also supports the Telegram notification service, via config.json it is possible to add your own chatID and add your own notification.

# Example Config

```
"presence": {
  "anyoneSensor":true,
  "delay":30,
  "type":"motion",
  "telegram": true,
  "token": "TOKENHERE",
  "chatID": "CHATIDHERE",
  "messages":{
    "sensorOn":"Welcome at home @",
    "sensorOff":"Bye bye @",
    "anyoneOn":"Prsence detected at home!",
    "anyoneOff":"No one at home!"
  },
  "devices":{
    "Peter":"00:11:22:33:44.55",
    "Maria":"123.456.123.1"
  }
}
```
_('@' means the plugin will put here the dynamic content, e.g. the name of the device/person where motion were detected)_

## New user/devices
Parameter to expose new motion sensors

| Attributes | Usage |
|------------|-------|
| custom name | Own definef name for Home |
| adress | MAC addresse  or IP addresse from the device |

## Optional
Optional parameter for Telegram notifications

| Attributes | Usage |
|------------|-------|
| anyoneSensor | Exposes new "Anyone" sensor to HomeKit for detecting presence at home |
| type | If setted to "motion", plugin will expose a motion sensor to HomeKit with FakeGato, otherwise it exposes occupancy sensor without FakeGato |
| delay | If delay > 0, a delay will be set to avoid wrong motion updates |
| telegram | If true, push notifications of detected presence (motion) |
| token | Token from your bot |
| chatID | Token from chatID where the notification will go |
| messages.sensorOn | Push telegram notification if sensor from device detects presence |
| messages.sensorOff | Push telegram notification if sensor from device detects no presence |
| messages.anyoneOn | Push telegram notification if 'Anyone' sensor detects presence |
| messages.anyoneOff | Push telegram notification if 'Anyone' sensor detects no presence |

## In-App Screenshot (Elgato EVE)

**Elgato EVE with Fakegato**
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/images/eve_motion_fakegato.PNG" align="center" alt="Presence EVE">
