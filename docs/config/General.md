# Fritz!Box General

Here are some points from the example-config.json which will be explained in more detail.




## Configuration

```
"polling": 5,
"timeout": 10,
"clearCache": false,
"debug":true,
"disableAutoSearch": false
"disableAutoConfig": false
```



## Required parameter

| Attributes | Usage                                                        | Req  |
| ---------- | ------------------------------------------------------------ | :--: |
| polling   | Polling in seconds (Default: 5s) |      |
| timeout   | Timeout in seconds before a request will break (Default: 5s) |      |
| clearCache   | If true, all accessories from cache AND HomeKit will be removed |      |
| debug   | Show more information in log (default: false) |      |
| disableAutoSearch   | Disables auto device search in network (default: false) |      |
| disableAutoConfig   | Disables auto config generator (default: false) |      |
