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
      uid: (this.config.username && this.config.password) ? this.config.username : 'root',
      pwd: this.config.password ? this.config.password : '',
      realm: 'F!Box SOAP-Auth',
      chCount: 0,
    };
  
  }
  
  async startEncryptedCommunication(){
    
    try{
    
      const devInfo = this.services['urn:dslforum-org:service:DeviceInfo:1'];
  
      let sslPort = await devInfo.actions.GetSecurityPort();

      sslPort = parseInt(sslPort.NewSecurityPort);
      
      if (typeof sslPort === 'number' && isFinite(sslPort)) {
      
        this._sslPort = sslPort;
      
      } else {
        
        throw 'Got bad port from Device. Port: ' + sslPort;
      
      }
      
      return this;
 
    } catch(err) {
    
      throw err;  
    
    }
  
  }

  stopEncryptedCommunication(){
    this._sslPort = null;
    return this;
  }

  async _parseServices(){

    try {
    
      const serviceArray = await this.getServicesFromDevice([], this.deviceInfo);
  
      let addServices = [];
    
      for(const service of serviceArray){
  
        let Service = new s.Service(this, service, this.config, this.log);
      
        let output = await Service._parseSCPD();
  
        addServices.push(output);
  
      }
  
      for (const serv of addServices) {
     
        if(serv){
     
          this.services[serv.deviceInfo.serviceType] = serv;
          this.deviceInfo.servicesInfo.push(serv.deviceInfo.serviceType);
     
        }
     
      }
  
      delete this.deviceInfo.deviceList;
      delete this.deviceInfo.serviceList;
      
      return this;
    
    } catch(err) {
    
      throw err;
    
    }

  }

  getServicesFromDevice(serviceArray, device){
    
    serviceArray = serviceArray.concat(device.serviceList.service);
    
    if (device.deviceList && Array.isArray(device.deviceList.device)) {

      for(const dev of device.deviceList.device)
        serviceArray = this.getServicesFromDevice(serviceArray, dev);
    
    } else if (device.deviceList && device.deviceList.device) {
    
      serviceArray = this.getServicesFromDevice(serviceArray, device.deviceList.device);
    
    }
    
    return serviceArray;
  
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
