# Common Issues / Frequently Asked Questions

Below, i have listed some frequently asked questions and errors that may be appear during the installation process.

## Deflection error

`[WARN] Cant check declection state, no deflections setted up in fritz.box settings!`

**Fix:** In order for deflection to work, a new deflection must first be added in the Fritz!Box settings, see example:

<img src="https://github.com/SeydX/homebridge-fritz-platform/blob/master/docs/images/deflection.png" align="center" alt="Deflection error">

<hr>

## Device state error (Invalid Action / 401)

```
[ERROR] An error occured by getting device state!
[ERROR] {
"error": "No message",
"errorCode": "No code",
"tr064": "Invalid Action",
"tr064code": "401",
"fault": "UPnPError",
"faultcode": "s:Client",
"serviceType": "urn:dslforum-org:service:WANPPPConnection:1",
"action": "GetStatusInfo"
}
```

**Fix:** You need to set the right router type in your config.json. If you are using a cable router, please put "type":"cable" in your config.json otherwise it is by default "type":"dsl"

<hr>
