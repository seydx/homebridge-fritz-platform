# Debugging

If you have any problems with this plugin and you can not find a solution, please feel free to open a issue.

**OR** you can also try do debug by yourself with following tools:


## Config Debug

Open your config.json and set debug to true

```"debug":true```

After this, restart homebridge and post the log in an issue.


## Attach Visual Studio Code Debugger

Create a file in `.vscode/launch.json` and paste the following content:

```
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Homebridge Debugging",
      "program": "<PATH_TO_YOUR_NODE_MODULES>/homebridge/bin/homebridge",
      "request": "launch",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "type": "pwa-node"
    }
  ]
}
```
Run `npm link` and then press `Run -> Start Debugging`.