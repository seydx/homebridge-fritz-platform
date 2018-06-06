# Fritz!Box

This plugin uses the TR 064 interface of the router to communicate with it. Host can be the local address (fritz.box) or ip adresse. Port is 49000. So that the plugin runs perfectly, please enter the access data from FritzBox web interface in the config.json. Timeout defines the maximum time a request can take (in seconds). Polling is the time span when the data should be refreshed.

# Example Config

```
  "platform": "FritzPlatform",
  "name": "FritzBox",
  "host": "fritz.box",
  "port": 49000,
  "timeout": 5,
  "username": "USERNAME",
  "password": "PASSWORD",
  "polling": 10
```
