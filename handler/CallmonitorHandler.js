'use strict';

const net = require('net');

class CallmonitorHandler {
  constructor (platform, config) {

    this.logger = platform.logger;
    this.config = config;

    this.connect();
 
  }
  
  connect(){
  
    this.client = net.createConnection(this.config.port, this.config.ip, () => {
    
      this.logger.info('Callmonitor connection established with ' + this.config.ip + ':' + this.config.port); 
      
    });
    
    this.client.on('error', error => {
        
      this.logger.error('Callmonitor: An error occured!');
      
      if(error.errno == 'ECONNREFUSED' || error.code == 'ECONNREFUSED'){
        
        this.logger.warn('Callmonitor: Can not connect to ' + this.config.ip + ':' + this.config.port + ' - Dial #96*5* to enable port 1012');
        
      } else if (error.errno == 'EHOSTUNREACH' || error.code == 'EHOSTUNREACH') {
        
        this.logger.warn('Callmonitor: Can not connect to ' + this.connect.ip + ':' + this.config.port + ' - IP address seems to be wrong!');
        
      } else if(error.errno == 'ENETUNREACH') {
        
        this.logger.warn('Callmonitor: Network currently not reachable!');
        this.reconnect();
      
      } else {
         
        this.logger.error(error);
        
      }
   
    });
    
    this.client.on('close', () => {
      
      this.logger.warn('Callmonitor: Connection were closed!');
      
    });
      
    this.client.on('end', () => {
      
      this.logger.warn('Callmonitor: Connection were ended!');
      
    });
    
    process.on('SIGTERM', () => {
      
      this.logger.info('Callmonitor: Shutting down..');
      this.client.destroy();

    });
  
  }
  
  reconnect(){

    setTimeout(() => {
    
      this.client.removeAllListeners();
      this.connect();
    
    }, 10000);
    
  }
  
  getClient(){
    
    if(this.client)
      return this.client;
  
    return false;
  
  }

}

module.exports = CallmonitorHandler;