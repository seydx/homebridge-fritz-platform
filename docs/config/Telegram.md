# Telegram

You are able to send notifications via Telegram if setted up in config.json . Notifications currently supported for presence detection and incoming/disconnected calls



## Example Telegram Configuration

```
"telegram": {
  "active": true,
  "token": "TOKEN",
  "chatID": "CHATID",
  "presence": {
    "in": "Willkommen zu Hause @",
    "out": "Auf Wiedersehen @",
    "anyoneIn": "Jemand ist zu Hause!",
    "anyoneOut": "Niemand zu Hause!"
  },
  "callmonitor": {
    "incoming": "Ankommende Anruf! @",
    "disconnected": "Anruf mit @ wurde beendet!"
  },
  "alarm": {
    "activated": "Alarm activated! Calling @!",
    "deactivated": "Alarm deactivated"
  },
  "extReboot":{
    "start":"Network reboot started!",
    "finish":"Network reboot completed!"
  }
}
```
_('@' means the plugin will put here the dynamic content, e.g. the name of the device/person where occupancy were detected or the nr from incomming/disconnected call)_



## Required Telegram parameter


| Attributes | Usage | Req |
|------------|-------|:----------:|
| telegram.active | If true, Telegram will be active (also need to add messages) (Default: false) |  |
| telegram.token | Token from your bot | x |
| telegram.chatID | Token from chatID where the notification will go | x |
| telegram.presence.in | Push telegram notification if sensor from device detects presence |  |
| telegram.presence.out | Push telegram notification if sensor from device detects no presence |  |
| telegram.presence.anyoneIn | Push telegram notification if 'Anyone' sensor detects presence |  |
| telegram.presence.anyoneOut | Push telegram notification if 'Anyone' sensor detects no presence |  |
| telegram.callmonitor.incoming | Incoming call message |  |
| telegram.callmonitor.disconnected | Disconnect message |  |

| Attributes                 | Usage                                                | Req  |
| -------------------------- | ---------------------------------------------------- | :--: |
| telegram.alarm.activated   | Push telegram notification if 'Alarm' is activated   |      |
| telegram.alarm.deactivated | Push telegram notification if 'Alarm' is deactivated |      |
| telegram.extReboot.start   | Push telegram notification if 'Reboot' starts        |      |
| telegram.extReboot.finish  | Push telegram notification if 'Reboot' finishs       |      |