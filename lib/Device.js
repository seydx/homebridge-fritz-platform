const async = require('async');
const crypto = require('crypto');
const s = require('./Service');

class Device {
  constructor(deviceInfo, config, log){
    this.config = config;
    this.log = log; 
    this.meta = deviceInfo;
    this.meta.servicesInfo = [];
    this.services = {};
    this._parseServices();
    this._sslPort = null;
    this._auth = {
      uid: null,
      realm: 'F!Box SOAP-Auth',
      chCount: 0,
    };
  }

  login(user, password){
    if (password === undefined) {
      this._auth.uid = 'DefaultUser';
      this._auth.pwd = user;
    } else {
      this._auth.uid = user;
      this._auth.pwd = password;
    }
  }

  logout(){
    this._auth.uid = null;
    this._auth.pwd = null;
    this._auth.chCount = 0;
  }

  startEncryptedCommunication(){
    const self = this;
    return new Promise(function(resolve, reject){
      if(!self.config.host.match('myfritz')){
        let devInfo = self.services['urn:dslforum-org:service:DeviceInfo:1'];
        devInfo.actions.GetSecurityPort(function(err, result) {
          if (!err) {
            let sslPort = parseInt(result.NewSecurityPort);
            if (typeof sslPort === 'number' && isFinite(sslPort)) {
              self._sslPort = sslPort;
              resolve(self);
            } else {
              reject('Got bad port from Device. Port:' + result.NewSecurityPort);
            }
          } else {
            reject('Encription is not supported for this device.');
          }
        });
      } else {
        self._sslPort = self.config.port;
        resolve(self);
      }
    });
  }

  stopEncryptedCommunication(){
    this._sslPort = null;
  }

  getServicesFromDevice(serviceArray, device){
    const self = this;
    serviceArray = serviceArray.concat(device.serviceList.service);
    if (device.deviceList && Array.isArray(device.deviceList.device)) {
      device.deviceList.device.forEach(function(dev) {
        serviceArray = self.getServicesFromDevice(serviceArray, dev);
      });
    } else if (device.deviceList && device.deviceList.device) {
      serviceArray = self.getServicesFromDevice(serviceArray, device.deviceList.device);
    }
    return serviceArray;
  }

  _parseServices(){
    const self = this;
    let serviceArray = self.getServicesFromDevice([], this.meta);
    let asyncAddService = self._addService.bind(this);
    return new Promise(function(resolve, reject){
      async.concat(serviceArray, asyncAddService, function(err, results){
        if(!err){
          for (const i in results) {
            if(results[i]!=null){
              self.services[results[i].meta.serviceType] = results[i];
              self.meta.servicesInfo.push(results[i].meta.serviceType);
            }
          }
          delete self.meta.deviceList;
          delete self.meta.serviceList;
          resolve(self);
        } else {
          reject(err);
        }
      });

    });

  }

  _addService(serviceData, callback){
    const self = this;
    new s.Service(this, serviceData, self.config, self.log, callback);
  }

  _calcAuthDigest(uid, pwd, realm, sn){
    let MD5 = crypto.createHash('md5');
    MD5.update(uid + ':' + realm + ':' + pwd);
    let secret = MD5.digest('hex');
    MD5 = crypto.createHash('md5');
    MD5.update(secret + ':' + sn);
    return MD5.digest('hex');
  }
}

exports.Device = Device;
