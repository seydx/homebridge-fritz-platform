'use strict';

const api = require('../lib/TR064.js');

const axios = require('axios');
const parseString = require('xml2js').parseString;

class HostsHandler {
  constructor (platform, config, device, devices, mainConfig) {

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.tcp = platform.tcp;
    this.platform = platform;

    this.config = config;
    this.mainConfig = mainConfig;
    this.device = device;    
    this.devices = devices;
    
    this.activeDevices = [];
    
    if(config.mesh){
      
      this.generateHostsListURL();

    } else {
    
      this.initDevices();  
    
    }

  }
  
  //NO MESH
  
  async initDevices(){
  
    try {

      let devices = [];
      let hostLists = [];
      let UserList = [];
  
      for(const device of Object.keys(this.devices)){
    
        if(this.devices[device].host && this.devices[device].port && this.devices[device].username && this.devices[device].password && this.devices[device].type)
          devices.push({
            name: device,
            host: this.devices[device].host,
            port: this.devices[device].port,
            username: this.devices[device].username,
            password: this.devices[device].password,
            timeout: this.mainConfig.timeout * 1000,
            type: this.devices[device].type
          });
    
      }
  
      for(const config of devices){

        if(!this.activeDevices[config.name]){    
      
          let dev = await this.generateApi(config);
          this.activeDevices[config.name] = dev;
      
        }

      }  

      for(const activeDevice of Object.keys(this.activeDevices)){
        
        let list = await this.getHosts(this.activeDevices[activeDevice]);
        
        if(list)
          hostLists.push(list);
     
      }
      
      
      for(const list in hostLists)
        for(const user in hostLists[list])
          UserList.push(hostLists[list][user]);
          
      this.hosts = UserList;

    } catch(err){

      this.logger.error('Host List (no mesh): An error occured while fetching devices!');
      this.debug(JSON.stringify(err, null, 4));

    } finally {

      setTimeout(this.initDevices.bind(this), this.mainConfig.polling * 1000);

    }
  
  }
  
  async generateApi(config){
  
    try{
    
      let TR064 = new api.TR064(config, this.logger);  
      TR064 = await TR064.initDevice();
        
      let device = await TR064.startEncryptedCommunication();
    
      return device;
    
    } catch(err){
    
      throw err;
    
    }

  }
  
  async getHosts(device){
  
    try {
    
      let hosts = device.services['urn:dslforum-org:service:Hosts:1'];
      hosts = await hosts.actions['X_AVM-DE_GetHostListPath']();
      
      let list = await this.generateHostListNM(hosts['NewX_AVM-DE_HostListPath'], device);
      
      return list;
    
    } catch(err){
    
      throw err;
    
    }
  
  }
  
  async generateHostListNM(endpoint, device){
  
    try {
    
      let ping = await this.tcp('Presence', device.config.host, device.config.port);
      
      if(ping){
    
        let url = 'http://' + device.config.host + ':' + device.config.port + endpoint;
        let hostArray = [];
      
        let hostList = await axios(url);  
        let hostListXML = await this.xmlParser(hostList.data);
        
        hostArray = hostArray.concat(hostListXML.List.Item);
        
        return hostArray;
        
      } else {
      
        this.debug('Host List (no mesh): Network currently not available!');
        return false;
        
      }
    
    } catch(error){
    
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
      
      throw error;
    
    }
  
  }
  
  //MESH
  
  async generateHostsListURL(){
  
    try{
    
      let hostsListURL = this.device.services['urn:dslforum-org:service:Hosts:1']; 
      hostsListURL = await hostsListURL.actions['X_AVM-DE_GetHostListPath']();
      
      this.generateHostList(hostsListURL['NewX_AVM-DE_HostListPath']);
    
    } catch(err){
    
      this.logger.error('Host List: An error occured while getting hosts list endpoint!');
      this.debug(JSON.stringify(err,null,4));
    
    }
  
  }
  
  async generateHostList(endpoint){
  
    try {
    
      let ping = await this.tcp('Host List', this.config.host, this.config.port);
      
      if(ping){
    
        let url = 'http://' + this.config.host + ':' + this.config.port + endpoint;
        let hostArray = [];
      
        let hostList = await axios(url);  
        let hostListXML = await this.xmlParser(hostList.data);
        
        hostArray = hostArray.concat(hostListXML.List.Item);
        this.hosts = hostArray;
        
        setTimeout(this.generateHostList.bind(this, endpoint), this.platform.config.polling * 1000);
    
      } else {
      
        this.debug('Host List: Network currently not available!');
        setTimeout(this.generateHostList.bind(this, endpoint), 30000);
      
      }
    
    } catch(error){
    
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
      
      this.logger.error('Host List: An error occured while genersting host list!');
      this.debug(JSON.stringify(error,null,4));
      
      setTimeout(this.generateHostsListURL.bind(this), 15000);
    
    }
  
  }
  
  xmlParser(xml){
  
    return new Promise((resolve, reject) => {
    
      parseString(xml, (err, result) => err ? reject(err) : resolve(result) );
   
    });
    
  }
  
  getHostList(){
  
    if(this.hosts)
      return this.hosts;
      
    return false;
  
  }

}

module.exports = HostsHandler;
