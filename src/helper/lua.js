'use strict';

const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');

module.exports = {

  requestLUA: async function(formData, host, path, typ){
  
    let url = 'http://' + host + path + '?sid=' + formData.sid;
    
    try {    
        
      let post = await axios.post(url, querystring.stringify(formData), { headers: { 'Content-Type': 'application/x-www-form-urlencoded'}});
        
      if(typ){
        
        let data = this.parseOutput(post.data, typ);
          
        return data;
        
      } else {
        
        return post.data;
        
      }
    
    } catch(error) {
      
      let err;
    
      if (error.response) {
        err = {
          status: error.response.status,
          text: error.response.statusText,
          message: error.response.data !== '' ? error.response.data : error.response.statusText
        };
      } else if (error.request) {
        err = 'No response from host!';
      } else {
        err = error.message;
      }
      
      throw err;
    
    }
  
  },
  
  parseOutput: async function(data, type){
  
    let value;
    
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
  
  }

};