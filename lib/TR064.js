const parseString = require('xml2js').parseString;
const axios = require('axios');

const d = require('./Device');
const TR64_DESC = '/tr64desc.xml';

class TR064 {

  constructor(config){

    this.options = {
      host: config.host,
      port: config.port||49000,
      username: config.username,
      password: config.password,
      timeout: config.timeout*1000||5000,
      type: config.type||'dsl'
    };  

    this.log = config.log || console;
  }

  initDevice(){
    
    let url = 'http://' + this.options.host + ':' + this.options.port + TR64_DESC;
    
    return new Promise((resolve, reject) => {

      axios(url)
        .then(response => {      
        
          parseString(response.data, { explicitArray: false }, async (error, result) => {
           
            if (error) return reject(error);
            
            let devInfo = result.root.device;
            devInfo.host = this.options.host;
            devInfo.port = this.options.port;
              
            devInfo.urlPart = TR64_DESC.substring(0, TR64_DESC.lastIndexOf('/'));
              
            const Device = new d.Device(devInfo, this.options, this.log);
              
            let getData = await Device._parseServices();
              
            resolve(getData);
         
          });

        }).catch(error => {

          if(error.response){
            error = {
              status: error.response.status,
              message: error.response.statusText,
              config: error.config,
              data: error.response.data
            };
          }
            
          reject(error);

        });
    
    });
  
  }

}

exports.TR064 = TR064;
