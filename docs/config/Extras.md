# Fritz!Box Extras

Here you can see how to set up extra characteristics such as alarm, broadband etc.

**Note:** Alarm, WakeUp, RingLock, Broadband are custom characteristics made by me and these are NOT supported natively from HomeKit. You can see these only with 3rd party apps like Elgato Eve app and these are all assigned to your main/master router!



# Alarm

If setted up in config.json, the plugin will create an alarm switch assigned to your main router for creating automations to receive a call from your router for a given time to a given nr

_Note: If you want to use this function, you need to activate phone dialer in your FritzBox WebUI !_



## Example Alarm Configuration

```
"alarm": {
  "active": true,
  "telNr": "0123456789",
  "duration": 30
}
```



## Required Alarm parameter

| Attributes | Usage                                                        | Req  |
| ---------- | ------------------------------------------------------------ | :--: |
| active     | If true, the plugin will create a custom alarm switch assigned to your main router (Default: false) |      |
| telNr      | Number of the phone that will be called if switch = on       |  x   |
| duration   | Duration of the phone call in seconds (Default: 30s)         |      |



# Phonebook

If setted up in config.json, the plugin will create an phoneBook switch assigned to your main router for extended callmonitor functionality (nr detection etc)



## Example Phonebook Configuration

```
"phoneBook": {
  "active": true,
  "blacklists": ["My Blacklist 1", "My Blacklist 2"]
}
```



## Required Phonebook parameter

| Attributes | Usage                                                        | Req  |
| ---------- | ------------------------------------------------------------ | :--: |
| active     | If true, the plugin will create a custom phonebook switch assigned to your main router (Default: false) |      |
| blacklists      | An array of books to block from notifications       |  x   |



# Wake up

If setted up in config.json, the plugin will create an wake up switch assigned to your main router for creating an automation to ring to a connected phone with an intern nr gor a given time

_Note: If you want to use this function, you need to activate phone dialer in your FritzBox WebUI !_



## Example Wake Up Configuration

```
"wakeup": {
  "active": true,
  "internNr": "**620",
  "duration": 60
}
```



## Required Wake Up parameter

| Attributes | Usage                                                        | Req  |
| ---------- | ------------------------------------------------------------ | :--: |
| active     | If true, the plugin will create a custom alarm switch assigned to your main router (Default: false) |      |
| internNr   | The intern phone number that will be called if switch = on   |  x   |
| duration   | Duration of the phone call (Default: 60s)                    |      |



# Ring lock

If setted up in config.json, the plugin will create an ring lock switch assigned to your main router to mute connected dect phones for a given time



## Example Ring lock Configuration

```
"ringlock": {
  "active": true,
  "DECTphones": 1,
  "start": "15:00",
  "end": "21:00"
}
```



## Required Ring Lock parameter

| Attributes | Usage                                                        | Req  |
| ---------- | ------------------------------------------------------------ | :--: |
| active     | If true, the plugin will create a custom alarm switch assigned to your main router (Default: false) |      |
| DECTphones | Amount of the DECT phones connected to the router            |  x   |
| start      | Start time                                                   |      |
| end        | End time                                                     |      |



# Broadband

If setted up in config.json, the plugin will create three custom characteristics (download speed, upload speed and ping) assigned to your main router



## Example Broadband Configuration

```
"broadband": {
  "active": true,
  "measureTime": 5
}
```



## Required Broadband parameter

| Attributes  | Usage                                                        | Req  |
| ----------- | ------------------------------------------------------------ | :--: |
| active      | If true, the plugin will create a custom alarm switch assigned to your main router (Default: false) |      |
| measureTime | Time of the measurement in seconds (Default: 5s)             |      |
| polling     | Time to start a new measurement in minutes (Default: 30min)  |      |



# Extended Reboot

If setted up in config.json, the plugin will create an extended reboot switch assigned to your main router to call in config.json given scripts after during/after reboot. See: [Multiple Instances](https://github.com/SeydX/homebridge-fritz-platform/blob/master/example/MultipleInstances.md) for example scripts.



## Example Extended Reboot Configuration

```
"extReboot": {
  "active": true,
  "cmdOn": "sh /PATHTOSCRIPT/reboot-start.sh",
  "cmdOff": "sh /PATHTOSCRIPT/reboot-finish.sh"
}
```



## Required Extended Reboot parameter

| Attributes | Usage                                                        | Req  |
| ---------- | ------------------------------------------------------------ | :--: |
| active     | If true, the plugin will create a custom alarm switch assigned to your main router (Default: false) |      |
| cmdOn      | Start script that will be executed before starting reboot    |  x   |
| cmdOff     | End script that will be executed after 5min of reboot        |  x   |



## Screenshots

![EVE 1](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics1.PNG)

![EVE 2](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/images/device_characteristics2.PNG)
