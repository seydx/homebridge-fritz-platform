'use strict';

const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');

class LUAHandler {
  constructor (platform, config, sid) {

    this.log = platform.log;
    this.logger = platform.logger;
    this.debug = platform.debug;
    this.tcp = platform.tcp;
    this.platform = platform;

    this.config = config;
    this.sid = sid;
    
  }
  
  async requestLUA(formData, path, device, typ){
  
    try {
    
      let ping = await this.tcp('LUA', this.config.host, this.config.port);
      
      if(ping){

        let sid = await this.sid.getSID(null, device); 
        let url = 'http://' + this.config.host + path + '?sid=' + sid;
        
        formData.sid = sid;
          
        this.debug('POST Request: ' + url + ' - ' + JSON.stringify(formData));
          
        let post = await axios.post(url, querystring.stringify(formData), { headers: { 'Content-Type': 'application/x-www-form-urlencoded'}});
        
        if(typ){
        
          let data = this.parseOutput(post.data, typ);
          
          return data;
        
        } else {
        
          return post.data;
        
        }
        
      } else {
      
        throw 'LUA: Network currently not available!';
      
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
  
  async parseOutput(data, type){

    let value;
  
    try {
    
      let $ = cheerio.load(data);
      let elements = $('input').toArray();
      
      for(const el of elements){
    
        if(el.attribs.name === type && el.attribs.checked){

          return el.attribs.value;
      
        } else {
          
          value = el.attribs.value || 0;

        }
    
      }
      
      return value;
    
    } catch(err){
    
      throw err;
    
    }
 
  }

}

module.exports = LUAHandler;