'use strict';

const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');

module.exports = (masterDevice) => {

  async function requestLUA(formData, path, typ){
  
    let url = 'http://' + masterDevice.host + path + '?sid=' + formData.sid;
        
    let post = await axios.post(url, querystring.stringify(formData), { headers: { 'Content-Type': 'application/x-www-form-urlencoded'}});
      
    if(typ){
      
      let data = this.parseOutput(post.data, typ);
        
      return data;
      
    } else {
      
      return post.data;
      
    }
      
  }
  
  async function parseOutput(data, type){
  
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
  
  return {
    requestLUA: requestLUA,
    parseOutput: parseOutput
  };

};