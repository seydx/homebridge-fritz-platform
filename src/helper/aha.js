'use strict';

const axios = require('axios');

module.exports = {

  request: async function(host, ain, sid, cmd){
    
    try { 
    
      let uri = 'http://' + host + '/webservices/homeautoswitch.lua?ain=' + ain + '&sid=' + sid + '&switchcmd=' + cmd;
      
      console.log(uri);
      
      await axios.get(uri);  
        
      return;
    
    } catch(error) {
      
      let err;
    
      if (error.response) {
      
        console.log(error.response);
      
        err = {
          ain: ain,
          cmd: cmd,
          status: error.response.status,
          text: error.response.statusText,
          message: error.response.data !== '' ? error.response.data : error.response.statusText
        };
      } else if (error.request) {
        err = {
          ain: ain,
          cmd: cmd,
          code: error.code,
          message: error.message
        };
      } else {
        err = {
          ain: ain,
          cmd: cmd,
          message: error.message
        };
      }
      
      throw err;
    
    }
  
  }

};