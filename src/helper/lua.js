'use strict';

const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');

module.exports = {

  requestLUA: async function(formData, host, path, target){
  
    let url = 'http://' + host + path + '?sid=' + formData.sid;
    
    try {    
        
      let post = await axios.post(url, querystring.stringify(formData), { headers: { 'Content-Type': 'application/x-www-form-urlencoded'}});
      
      if(target)
        return this.parseOutput(post.data, target);
        
      return post.data;
    
    } catch(error) {
      
      let err;
    
      if (error.response) {
        err = {
          name: target,
          status: error.response.status,
          text: error.response.statusText,
          message: error.response.data !== '' ? error.response.data : error.response.statusText
        };
      } else if (error.request) {
        err = {
          name: target,
          code: error.code,
          message: error.message
        };
      } else {
        err = {
          name: target,
          message: error.message
        };
      }
      
      throw err;
    
    }
  
  },
  
  parseOutput: async function(data, target){
    
    let $ = cheerio.load(data);
    let elements = $('input').toArray();
    
    for(const el of elements)
      if(el.attribs.name === target)
        return el.attribs;
    
    return false;
  
  }

};