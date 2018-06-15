const parseString = require('xml2js').parseString;
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
    
    this.getContent = function(url) {
      return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? require('https') : require('http');
        const request = lib.get(url, (response) => {
          if (response.statusCode < 200 || response.statusCode > 299) {
            reject(new Error('Failed to load data, status code: ' + response.statusCode));
          }
          const body = [];
          response.on('data', (chunk) => body.push(chunk));
          response.on('end', () => resolve(body.join('')));
        });
        request.on('error', (err) => reject(err));
      });
    };
  }

  initDevice(){
    const self = this;
    const nurl = 'http://' + self.host + ':' + self.port + '/tr64desc.xml';
    return new Promise(function(resolve, reject){
      self.getContent(nurl)
        .then(data => {
          parseString(data, { explicitArray: false }, function(err, result) {
            if (!err) {
              var devInfo = result.root.device;
              devInfo.host = self.host;
              devInfo.port = self.port;
              var path = URL.parse(nurl).pathname;
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
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}

exports.TR064 = TR064;
