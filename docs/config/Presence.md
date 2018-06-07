# Presence

If you add new devices (MAC addresses) under 'presence' in the config.json, they will be added to HomeKit as motion sensors with FakeGato support.

The presence is carried out via WiFi detection. If you connect with the Wlan, the accessory will switch to "motion detected", otherwise it switches to "no motion"

There is also a possibility to set a delay. This prevents the motion sensor from going to "no movement" when the device logs out of the repeater and connects to the router or vice versa. Only if there is still no connection in the specified time, the motion sensor goes to "no movement". If delay = 0 or removed, this option is deactivated

Presence also supports the Telegram notification service, via config.json it is possible to add your own chatID and add your own texts for **anyone** and **noone**

anyone means: If a motion sensor (except Anyone sensor) detects motion
noone means: If all motion sensors are on "no motion"

# Example Config

```
"presence": {
  "John":"01:02:03:04:05:06",
  "Maria":"11:22:33:44:55:66",
  "delay":30
  "telegram": true,
  "token": "TOKENHERE",
  "chatID": "CHATIDHERE",
  "messages":{
    "anyone":"Welcome at home @",
    "noone":"No one at home!"
  }
}
```
_('@' means the plugin will put here the dynamic content, e.g. the name of the device/person where motion were detected)_

## New user/devices
Parameter to expose new motion sensors

| Attributes | Usage |
|------------|-------|
| custom name | Own definef name for Home |
| mac adress | MAC adresse from the device |

## Optional
Optional parameter for Telegram notifications

| Attributes | Usage |
|------------|-------|
| delay | If delay > 0, a delay will be set to avoid wrong motion updates |
| telegram | If true, push notifications of detected presence (motion) |
| token | Token from your bot |
| chatID | Token from chatID where the notification will go |
| messages.anyone | Message for detected presence from motion sensor |
| messages.noone | Message for no motion detected |

## In-App Screenshot (Elgato EVE)

**Elgato EVE with Fakegato**
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/images/eve_motion_fakegato.PNG" align="center" alt="Presence EVE">
