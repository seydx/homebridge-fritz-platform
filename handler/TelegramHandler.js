'use strict';

const https = require('https');

class TelegramHandler {
  constructor (platform, config) {

    this.debug = platform.debug;    
    this.config = config;

  }

  sendTelegram(type, message, param1, param2){
  
    this.debug('Telegram: Sending new message (' + type + ')');
    
    return new Promise((resolve,reject) => {
    
      let msg = this.config[type][message];
    
      if(param1)
        msg = msg.replace('@', param1);
        
      if(param2)
        msg = msg.replace('%', param2);
      
      const post_data = JSON.stringify({
        chat_id: this.config.chatID,
        text: msg,
        parse_mode: 'Markdown'
      });
      
      const postheaders = {
        'Content-Type' : 'application/json'
      };
      
      const options = {
        host:'api.telegram.org',
        path:'/bot' + this.config.token + '/sendMessage',
        method:'POST',
        headers : postheaders
      };
      
      const req = https.request(options,function (res){
      
        if(res.statusCode<200||res.statusCode>299){
          reject(new Error('Failed to load data, status code:'+res.statusCode));
        }
        
        const body=[];
        res.on('data',(chunk)=>body.push(chunk));
        res.on('end',()=>resolve(body.join('')));
        
      });
      
      req.on('error',(err)=>reject(err));
      req.write(post_data);
      req.end();
      
    });
    
  }
  
  checkTelegram(type, message){
  
    if(this.config[type][message])
      return true;
  
    return false;
      
  }

}

module.exports = TelegramHandler;