const parseString = require('xml2js').parseString;
const request = require('request');
const URL = require('url');
const d = require('./Device');

class TR064 {

  constructor(config, log){
    this.host = config.host;
    this.port = config.port;
    this.username = config.username;
    this.password = config.password;
    this.config = config;
    this.log = log;
  }

  initDevice(){
    const self = this;
    let startUrl = (self.host.match('myfritz') ? 'https://' : 'http://');
    let nurl = startUrl + self.host + ':' + self.port + (self.host.match('myfritz') ? '/tr064/tr64desc.xml' : '/tr64desc.xml');
    let options = {
      uri: nurl
    };
    if(self.host.match('myfritz')){
      options.auth = {
        user: self.username,
        pass: self.password,
        sendImmediately: false,
        agentOptions:{
          rejectUnauthorized: false  
        }
      };
    }
    return new Promise(function(resolve, reject){
      request(options, function(error, response, body){
        if (!error && response.statusCode == 200){
          parseString(body, { explicitArray: false }, function(err, result) {
            if (!err) {
              let devInfo = result.root.device;
              devInfo.host = self.host;
              devInfo.port = self.port;
              let path = URL.parse(nurl).pathname;
              devInfo.urlPart = path.substring(0, path.lastIndexOf('/'));
              const newDevice = new d.Device(devInfo, self.config, self.log);
              newDevice._parseServices()
                .then(result => {
                  resolve(result);
                })
                .catch(err => {
                  reject(err);
                });
            } else {
              reject(err);
            }
          });
        }
        else{
          if(response){
            let err = {
              error: response.statusMessage,
              errorCode: response.statusCode
            };
            reject(err);
          } else {
            reject(error);
          }
        }
      });
    });
  }
}

exports.TR064 = TR064;
