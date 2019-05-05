const parseString = require('xml2js').parseString;
const axios = require('axios');
const dgram = require('dgram');

const d = require('./Device');
const TR64_DESC = '/tr64desc.xml';

const foundDevices = [];

class TR064 {

  constructor(config, log){
    
    if(config){
    
      this.config = {
        host: config.host,
        port: config.port||49000,
        username: config.username,
        password: config.password,
        timeout: config.timeout*1000||5000,
        type: config.type||'dsl'
      };  

      this.log = log || console;
  
    }
  
  }
  
  searchDevices(){
	  
	  return new Promise((resolve, reject) => {
		  
		  let deviceArray = [];
		  
		  const socket = dgram.createSocket({ type: 'udp4' })
		    
		  const request = Buffer.from([
		    'M-SEARCH * HTTP/1.1',
		    'HOST: 239.255.255.250:1900',
		    'MAN: "ssdp:discover"',
		    'MX: 5',
		    'ST: urn:dslforum-org:device:LANDevice:1',
		    ''
		  ].join('\r\n'))
		
		  socket.on('message', (buffer, rinfo) => {
          
            if(!foundDevices[rinfo.address]){
            
              foundDevices[rinfo.address]  = rinfo;
  		    
    	      const message = buffer.toString().trim()
  	  
  		      const obj = {}
  		      const lines = message.toString().trim().split('\r\n')
  				
  		      if (lines && lines[0]) {
  		 		
  		        obj.status = lines[0]
  				
  		        for (const line of lines) {
  				  
  		          const fields = line.split(': ')
  				  
  		          if (fields.length === 2) {
  				   
  		            obj[fields[0].toLowerCase()] = fields[1]
  				   
  		          }
  				 
  		        }
  			  
  		      }
              
  		      axios(obj.location)
  		        .then( res => {
  		
  		          parseString(res.data, function (err, result) {
  			        
  			        if(err) return reject(err)
  						
  		            let device = {
  		              name: result.root.device[0].friendlyName[0],
  		              address: rinfo.address,
  		              port: obj.location.split(':')[2].split('/')[0],
  		              location: obj.location,
  		              serial: 'FB-'+rinfo.address.replace(/\./g, '')
  		            }
  						
  		            deviceArray.push(device)
  					
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
  		    
            }  
            
		  })
		
		  socket.on('error', (error) => {
		    
		    reject(error);
		    
		  })
		
		  socket.send(request, 0, request.length, 1900, '239.255.255.250')
		    
		  setTimeout(() => {
			socket.close();  
			resolve(deviceArray);
		  }, 5000);
		  
	  })
	  
  }

  initDevice(){
    
    let url = 'http://' + this.config.host + ':' + this.config.port + TR64_DESC;
    
    return new Promise((resolve, reject) => {

      axios(url)
        .then(response => {      
        
          parseString(response.data, { explicitArray: false }, async (error, result) => {
           
            if (error) return reject(error);
            
            let devInfo = result.root.device;
            devInfo.host = this.config.host;
            devInfo.port = this.config.port;
              
            devInfo.urlPart = TR64_DESC.substring(0, TR64_DESC.lastIndexOf('/'));
              
            const Device = new d.Device(devInfo, this.config, this.log);
              
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
