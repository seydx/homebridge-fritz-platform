'use strict';

const Logger = require('./logger.js');

const { Telegraf } = require('telegraf');

class Telegram {

  constructor (options, messages) {
    
    this.token = options.token;
    this.chatID = options.chatID;
    this.messages = messages;
    
    this.bot = false;

  }
  
  async start(){
  
    Logger.debug('Connecting to Telegram...');

    const bot = new Telegraf(this.token);
    
    bot.catch((err, ctx) => {
      Logger.error('Telegram: ' + ctx.updateType + ' Error: ' + err.message);
    });
    
    bot.start((ctx) => {
      if (ctx.message) {
        const from = ctx.message.chat.title || ctx.message.chat.username || 'unknown';
        const message = 'Chat ID for ' + from + ': ' + ctx.message.chat.id;
        ctx.reply(message);
        Logger.debug('Telegram: ' + message);
      }
    });
    
    await bot.launch();
    
    this.bot = bot.telegram;
    
    return;
  
  }
  
  async stop(){
  
    Logger.debug('Stopping Telegram...');
    
    if(this.bot){
      await this.bot.stop();
      this.bot = false;
    }
    
    return;
  
  }
  
  async send(target, dest, replacer){
  
    if(!this.bot)
      return;
  
    try {
      
      if(this.messages[target] && this.messages[target][dest]){
      
        let message = this.messages[target][dest].includes('@') && replacer ? this.messages[target][dest].replace('@', replacer) : this.messages[target][dest];
      
        Logger.debug('Telegram: Sending Message: ' + message);
        await this.bot.sendMessage(this.chatID, message);
      
      } else {
      
        Logger.debug('Telegram: Skip sending, no message defined for ' + target);
      
      }
    
    } catch(err) {
      
      Logger.error('An error occured during sending telegram message!');
      Logger.error(err);
      
    }
    
    return;
    
  }

}

module.exports = Telegram;