# Debugging

If you have any problems with this plugin and you can not find a solution [here](https://github.com/SeydX/homebridge-fritz-platform/blob/master/FAQ.md), please feel free to open a issue.

**OR** you can also try do debug by yourself with following tools:


## Fritz!Platform Util

- [Fritz!Platform Util](https://github.com/SeydX/fritzplatform-util)
: This little CLI tool will allow you to debug all services from your AVM device. This tool is capable to expose the services and methods to the terminal and will give you the oppurtunity to test the functions in your terminal without disturbing the plugin. This can be a great help also for me to detect the issue. To find the right service, give a look into the rror output in the plugin log. This can be as follow:

```
[FritzPlatform] [ERROR] {
 "error": "No message",
 "errorCode": "No code",
 "tr064": "Action Failed",
 "tr064code": "501",
 "serviceType": "urn:dslforum-org:service:X_VoIP:1",
 "action": "X_AVM-DE_DialNumber"
}
```

As you see, the service is ```urn:dslforum-org:service:X_VoIP:1``` and the method/action is ```X_AVM-DE_DialNumber```.


## Fritz!Platform Config Generator

- [Fritz!Platform Config Generator](https://github.com/SeydX/fritzplatform-util)
: This tool will help you to generate the platform part of this plugin. The config for this plugin may be very big and confusing, because of this, i created a generator (CLI) that will help you with generating your own config without any linting issues. So if you have problems with your config.json, give it a try!
