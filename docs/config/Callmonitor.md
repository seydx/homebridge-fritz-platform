# Fritz!Box Callmonitor

Fritz!Box supports the listening of incoming and outgoing calls via the port 1012. This can be used to create automations that immediately contact you when you receive a call, even if you are not at home. Via the built-in Telegram Notifications service, you can also conveniently send push notifications with your own text which can be created over the config.json



## First steps

Before you can use Callmonitor you have to activate port **1012**. You do that by calling the number **#96\*5*** with the phone which is connected to the Fritz!Box. That's it. (Port can be closed again at any time via the number **#96\*4***)

If you do not have a connected device, you can also do it via the phone book. Activate "Phone Dialer" and then create a new entry with the phone number "#95\*5*" in the phone book. Go back to the overview and click on the number with the mouse, the Fritz!Box already calls the number and activates the port 1012



**1. Phone dialer**
![Dialer](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/dialer.png)



**2. Enable port via phone book**
![PhoneBook](https://raw.githubusercontent.com/SeydX/homebridge-fritz-platform/master/docs/images/ports_callmonitor.png)



## Example Config

```
"callmonitor": {
  "disable": false,
  "ip": "192.168.178.1",
  "port": 1012,
  "country": "DE",
  "incomingTo":"12345678",
  "outgoingFrom":"12345678"
}
```



## Required parameter

| Attributes | Usage |
|------------|-------|
| active | If false, the contact sensors for incoming and outgoing calls will be removed (Default: false) |
| ip | Ip adress from the Fritz!Box where the handsets are connected to |
| port | Port from callmonitor (Default: 1012) |



## Optional parameter

| Attributes | Usage |
|------------|-------|
| country | Country prefix of current location, needed for phonebook storage and to detect if the nr that is calling or the number you call is in storage |
| incomingTo | If several numbers are in use, this option can also be used to specify which number Callmonitor should react to for incoming calls |
| outgoingFrom | If several numbers are in use, this option can also be used to specify which number Callmonitor should react to for outgoing calls |



## Screenshots

![Callmonitor](https://github.com/SeydX/homebridge-fritz-platform/raw/master/images/callmonitor.jpg)
