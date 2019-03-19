const async = require('async');
const crypto = require('crypto');
const s = require('./Service');

class Device {
  constructor(deviceInfo, config, log){
    this.config = config;
    this.deviceInfo = deviceInfo;
    this.deviceInfo.servicesInfo = [];
    this.services = {};
    this.log = log;

    this._sslPort = null;
    this._auth = {
      uid: null,
      realm: 'F!Box SOAP-Auth',
      chCount: 0,
    };

    this._parseServices();
  }

  login(user, password){
    if (password === undefined) {
      this._auth.uid = 'root';
      this._auth.pwd = '';
    } else {
      this._auth.uid = user?user:'root';
      this._auth.pwd = password;
    }
  }

  logout(){
    this._auth.uid = null;
    this._auth.pwd = null;
    this._auth.chCount = 0;
  }

  startEncryptedCommunication(){
    const self=this;
    return new Promise(function(resolve, reject){
      if(!self.config.host.match('myfritz')){
        self._getSSLPort(function(err, port) {
          if (!err) {
            self._sslPort = port;
            resolve(self);
          } else {
            reject(err);
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

  _getSSLPort(callback){
    const devInfo = this.services['urn:dslforum-org:service:DeviceInfo:1'];
    devInfo.actions.GetSecurityPort(null,{name:devInfo.config.name + ' GetSecurityPort',count:0},function(err, result) {
      if (!err) {
        const sslPort = parseInt(result.NewSecurityPort);
        if (typeof sslPort === 'number' && isFinite(sslPort)) {
          callback(null, sslPort);
        } else {
          callback('Got bad port from Device. Port:' + result.NewSecurityPort, null);
        }
      } else {
        callback('Encription is not supported for this device.', null);
      }
    });
  }

  _parseServices(){
    const self = this;

    const serviceArray = self.getServicesFromDevice([], this.deviceInfo);
    const asyncAddService = self._addService.bind(this);
    return new Promise(function(resolve, reject){

      async.concat(serviceArray, asyncAddService, function(err, results){
        if(!err){
          for (const i in results) {
            if(results[i]!=null){
              self.services[results[i].deviceInfo.serviceType] = results[i];
              self.deviceInfo.servicesInfo.push(results[i].deviceInfo.serviceType);
            }
          }
          delete self.deviceInfo.deviceList;
          delete self.deviceInfo.serviceList;
          resolve(self);
        } else {
          reject(err);
        }
      });

    });

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

  _addService(serviceData, callback){
    const self = this;
    new s.Service(this, serviceData, self.config, self.log, callback);
  }

  _calcAuthDigest(uid, pwd, realm, sn){
    let MD5 = crypto.createHash('md5');
    MD5.update(uid + ':' + realm + ':' + pwd);
    const secret = MD5.digest('hex');
    MD5 = crypto.createHash('md5');
    MD5.update(secret + ':' + sn);
    return MD5.digest('hex');
  }
}

exports.Device = Device;
