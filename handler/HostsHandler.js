'use strict';

const axios = require('axios');
const parseString = require('xml2js').parseString;

class HostsHandler {
  constructor (platform, config, device) {

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.tcp = platform.tcp;
    this.platform = platform;

    this.config = config;
    this.device = device;
    
    this.generateHostsListURL();

  }
  
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