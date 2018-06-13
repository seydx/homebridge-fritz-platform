# Fritz!Box Callmonitor

Fritz!Box supports the listening of incoming and outgoing calls via the port 1012. This can be used to create automations that immediately contact you when you receive a call, even if you are not at home. Via the built-in Telegram Notifications service, you can also conveniently send push notifications with your own text which can be created over the config.json

# First steps

Before you can use Callmonitor you have to activate port 1012. You do that by calling the number "#95\*5*" with the phone which is connected to the Fritz!Box. That's it. (Port can be closed again at any time via the number "#95\*4*")

If you do not have a connected device, you can also do it via the phone book. Activate "Phone Dialer" and then create a new entry with the phone number "#95\*5*" in the phone book. Go back to the overview and click on the number with the mouse, the Fritz!Box already calls the number and activates the port 1012

**1. Phone dialer**
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/dialer.png" align="center" alt="Phone Dialer">


**2. Enable port via phone book**
<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/ports_callmonitor.png" align="center" alt="Phonebook ports">


# Example Config

```
"callmonitor": {
  "disable": false,
  "ip": "192.168.178.1",
  "port": 1012,
  "telegram": true,
  "token": "TOKENHERE",
  "chatID": "CHATIDHERE",
  "messages":{
    "incoming":"Incoming call from @ to %",
    "disconnected":"Incoming call from @ was disconnected!"
  }
}
```
_('@' and '%' defines the area where dynamic content like caller/called information - name and number - will come)_

## Base
Required parameter

| Attributes | Usage |
|------------|-------|
| disable | If true, the contact sensors for incoming and outgoing calls will be removed |
| ip | Ip adress from the Fritz!Box where the handsets are connected to |
| port | Port from callmonitor (Default: 1012) |

## Optional
Optional parameter for Telegram notifications

| Attributes | Usage |
|------------|-------|
| telegram | If true, push notifications of incoming calls |
| token | Token from your bot |
| chatID | Token from chatID where the notification will go |
| messages.incoming | Incoming call message |
| messages.disconnected | Disconnect message |
