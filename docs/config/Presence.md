# Presence

If you add new devices (MAC addresses) under 'presence' in the config.json, they will be added to HomeKit as motion sensors with FakeGato support.

The presence is carried out via WiFi detection. If you connect with the Wlan, then accessory 'motion detected'. If you disconnect then accessory 'no movement'

Presence also supports the Telegram notification service, via config.json it is possible to add your own chatID and add your own texts for **anyone** and **noone**

anyone means: If a motion sensor detects motion
noone means: if the 'Anyone' sensor do not detect motion anymore

# Example Config

```
"presence": {
  "John":"01:02:03:04:05:06",
  "Maria":"11:22:33:44:55:66",
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


**Elgato EVE with Fakegato**
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/images/eve_motion_fakegato.PNG" align="center" alt="Presence EVE">
