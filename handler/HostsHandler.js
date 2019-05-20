'use strict';

const api = require('../lib/TR064.js');

const axios = require('axios');
const parseString = require('xml2js').parseString;

class HostsHandler {
  constructor (platform, config, device, devices, mainConfig) {

    this.logger = platform.logger;
    this.debug = platform.debug;
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

    } catch(error){

      this.logger.error('Host List (no mesh): An error occured while fetching devices!');
      
      if(error instanceof TypeError){
        console.log(error);
      } else {
        this.debug(error);
      }

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
    
    } catch(error){
    
      throw error;
    
    }

  }
  
  async getHosts(device){
  
    try {
    
      let hosts = device.services['urn:dslforum-org:service:Hosts:1'];
      hosts = await hosts.actions['X_AVM-DE_GetHostListPath']();
      
      let list = await this.generateHostListNM(hosts['NewX_AVM-DE_HostListPath'], device);
      
      return list;
    
    } catch(error){
    
      throw error;
    
    }
  
  }
  
  async generateHostListNM(endpoint, device){
  
    try {
    
      let url = 'http://' + device.config.host + ':' + device.config.port + endpoint;
      let hostArray = [];
      
      let hostList = await axios(url);  
      let hostListXML = await this.xmlParser(hostList.data);
        
      hostArray = hostArray.concat(hostListXML.List.Item);
        
      return hostArray;
    
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
    
    } catch(error){
    
      this.logger.error('Host List: An error occured while getting hosts list endpoint!');
      
      if(error instanceof TypeError){
        console.log(error);
      } else {
        this.debug(error);
      }
    
    }
  
  }
  
  async generateHostList(endpoint){
  
    try {
    
      let url = 'http://' + this.config.host + ':' + this.config.port + endpoint;
      let hostArray = [];
      
      let hostList = await axios(url);  
      let hostListXML = await this.xmlParser(hostList.data);
        
      hostArray = hostArray.concat(hostListXML.List.Item);
      this.hosts = hostArray;
    
    } catch(error){
    
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
      
      this.logger.error('Host List: An error occured while generating host list!');
      
      if(error instanceof TypeError){
        console.log(error);
      } else {
        this.debug(error);
      }
    
    } finally {

      setTimeout(this.generateHostsListURL.bind(this), this.platform.config.polling * 1000);

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