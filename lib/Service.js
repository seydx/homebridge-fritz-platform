const parseString = require('xml2js').parseString;
const request = require('request');

class Service{
  constructor(device, serviceInfo, config, log, callback){
    this.config = config;
    this.host = device.meta.host;
    this.port = device.meta.port;
    this.log = log;
    this.device = device;
    this.meta = serviceInfo;
    this.meta.actionsInfo = [];
    this.readyCallback = callback;
    this.actions = {};
    this.stateVariables = {};
    this.logAttempts = [];
    this.config = config;
    this.timeout=config.timeout||10000;
    this.waitForAuth = {};
    this.randomInt = function(max) {
      return Math.floor(Math.random() * Math.floor(max));
    };
    this._parseSCPD(this);
  }
  
  bind(scope, fn) {
    return function() {
      return fn.apply(scope, arguments);
    };
  }

  _parseSCPD(obj){
    const self = this;
    if (obj.device.meta.urlPart && obj.device.meta.urlPart.length > 0) {
      obj.meta.SCPDURL = obj.meta.SCPDURL.replace('/tr064', '');  
      obj.meta.SCPDURL = obj.device.meta.urlPart + obj.meta.SCPDURL;
    }
    let startUrl = (self.host.match('myfritz') ? 'https://' : 'http://');
    let url = startUrl + obj.host + ':' + obj.port + obj.meta.SCPDURL;
    let options = {
      uri: url
    };
    if(self.host.match('myfritz')){
      options.auth = {
        user: self.config.username,
        pass: self.config.password,
        sendImmediately: false
      };
    }
    request(options, function(error, response, body){
      if (!error && response.statusCode == 200){
        parseString(body,{explicitArray: false},function(err, result) {
          let pA = self._parseActions.bind(obj);
          pA(result.scpd.actionList.action);
          obj.readyCallback(null, obj);
        });
      }
      else{
        obj.readyCallback(error, null); 
      }
    });
  }

  _parseActions(actionData){
    const self = this;
    if (!Array.isArray(actionData)) {
      return;
    }
    let insA = self._insertAction.bind(this);
    actionData.forEach(insA);
  }
  
  _insertAction(el){
    const self = this;
    let outArgs = [];
    let inArgs = [];
    if (el.argumentList && Array.isArray(el.argumentList.argument)) {
      el.argumentList.argument.forEach(function(argument) {
        self._pushArg(argument, inArgs, outArgs);
      });
    } else if (el.argumentList) {
      self._pushArg(el.argumentList.argument, inArgs, outArgs);
    }
    
    this.meta.actionsInfo.push({
      name: el.name,
      inArgs: inArgs,
      outArgs: outArgs,
    });
  
    this.actions[el.name] = self.bind(this, function(vars, callback) {
      this._callAction(el.name, inArgs, outArgs, vars, callback);
    });

  }
  
  _pushArg(argument, inArgs, outArgs){
    if (argument.direction == 'in') {
      inArgs.push(argument.name);
    } else if (argument.direction == 'out') {
      outArgs.push(argument.name);
    }
  }

  _callAction(name, inArguments, outArguments, vars, callback){
    const self = this;
    if (typeof vars === 'function') {
      callback = vars;
      vars = [];
    }
    let initID = self.randomInt(99999);
    this.bind(
      this,
      this._sendSOAPActionRequest(
        this.device,
        this.meta.controlURL,
        this.meta.serviceType,
        name,
        inArguments,
        outArguments,
        initID,
        vars,
        callback
      )
    );
  }
  
  _sendSOAPActionRequest(device,url,serviceType,action,inArguments,outArguments,initID,vars,callback){
    const self = this;
    if(self.SOAPtimeout)clearTimeout(self.SOAPtimeout);
    if(!Object.keys(self.waitForAuth).length||
    (serviceType==self.waitForAuth.serviceType&&
     action==self.waitForAuth.action&&
     vars==self.waitForAuth.vars&&
     url==self.waitForAuth.url&&
     inArguments==self.waitForAuth.inArguments&&
     outArguments==self.waitForAuth.outArguments&&
     device.meta.host==self.waitForAuth.host&&
     initID==self.waitForAuth.initID)){
      var head = '';
      if (device._auth.uid) {
      // Content Level Authentication
        if (device._auth.auth) {
          self.waitForAuth = {};  
          head = '<s:Header>' +
               '<h:ClientAuth xmlns:h="http://soap-authentication.org/digest/2001/10/"' +
               's:mustUnderstand="1">' +
               '<Nonce>' +
               device._auth.sn +
               '</Nonce>' +
               '<Auth>' +
               device._auth.auth +
               '</Auth>' +
               '<UserID>' +
               device._auth.uid +
               '</UserID>' +
               '<Realm>' +
               device._auth.realm +
               '</Realm>' +
               '</h:ClientAuth>' +
               '</s:Header>';
        } else {
          self.waitForAuth = {
            serviceType:serviceType, 
            action:action,
            vars:vars,
            url:url,
            inArguments:inArguments,
            outArguments:outArguments,
            host: device.meta.host,
            initID: initID
          };
          // First Auth
          head = ' <s:Header>' +
               '<h:InitChallenge xmlns:h="http://soap-authentication.org/digest/2001/10/"' +
               's:mustUnderstand="1">' +
               '<UserID>' +
               device._auth.uid +
               '</UserID>' +
               '<Realm>' +
               device._auth.realm +
               '</Realm>' +
               '</h:InitChallenge>' +
               '</s:Header>';
        }
      }
      let body = '<?xml version="1.0" encoding="utf-8"?>' +
               '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s=" http://schemas.xmlsoap.org/soap/envelope/">' +
               head +
               '<s:Body>' +
               '<u:' +
               action +
               ' xmlns:u="' +
               serviceType +
               '">';
      for (const i in vars) {
        body += '<' + vars[i].name + '>';
        body += vars[i].value;
        body += '</' + vars[i].name + '>';
      }
      body = body + '</u:' + action + '>' + '</s:Body>' + '</s:Envelope>';
      let port = 0;
      let proto = '';
      let agentOptions = null;
      if (device._sslPort) {
        port = device._sslPort;
        proto = 'https://';
        agentOptions = {
          rejectUnauthorized: false
        };
      } else {
        proto = (self.host.match('myfritz') ? 'https://' : 'http://');
        port = device.meta.port;
      }
      let addPath = (self.host.match('myfritz') ? '/tr064' : '');
      let uri = proto + device.meta.host + ':' + port + addPath + url;
      const that = this;
      let options = {
        method: 'POST',
        uri: uri,
        agentOptions: agentOptions,
        headers: {
          SoapAction: serviceType + '#' + action,
          'Content-Type': 'text/xml; charset="utf-8"',
        },
        body: body,
        timeout: self.config.timeout,
      };
      if(self.host.match('myfritz')){
        options.auth = {
          user: self.config.username,
          pass: self.config.password,
          sendImmediately: false
        };
      }
      request(options,function(error, response, body) {
        if (!error && response.statusCode == 200) {
          parseString(
            body,
            {
              explicitArray: false,
            },
            function(err, result) {
              let res = {};
              let env = result['s:Envelope'];
              if (env['s:Header']) {
                let header = env['s:Header'];
                if (header['h:Challenge']) {
                  let ch = header['h:Challenge'];
                  if (self.logAttempts.length) {
                    for (const i in self.logAttempts) {
                      if ((self.logAttempts[i].service == serviceType && self.logAttempts[i].action == action)) {
                        if (self.logAttempts[i].attempts >= 1) {
                          error = new Error('Credentials incorrect');
                        } else {
                          self.logAttempts[i].attempts += 1;
                          device._auth.des = serviceType;
                          device._auth.sn = ch.Nonce;
                          device._auth.realm = ch.Realm;
                          device._auth.auth = device._calcAuthDigest(
                            device._auth.uid,
                            device._auth.pwd,
                            device._auth.realm,
                            device._auth.sn
                          );
                          device._auth.chCount++;
                          that._sendSOAPActionRequest(
                            device,
                            url,
                            serviceType,
                            action,
                            inArguments,
                            outArguments,
                            initID,
                            vars,
                            callback
                          );
                          return;
                        }
                      }
                    }
                  } else {
                    self.logAttempts.push({ service: serviceType, action: action, attempts: 1 });
                    device._auth.sn = ch.Nonce;
                    device._auth.realm = ch.Realm;
                    device._auth.auth = device._calcAuthDigest(
                      device._auth.uid,
                      device._auth.pwd,
                      device._auth.realm,
                      device._auth.sn
                    );
                    device._auth.chCount++;
                    that._sendSOAPActionRequest(
                      device,
                      url,
                      serviceType,
                      action,
                      inArguments,
                      outArguments,
                      initID,
                      vars,
                      callback
                    );
                    return;
                  }
                } else if (header['h:NextChallenge']) {
                  let nx = header['h:NextChallenge'];
                  for (const i in self.logAttempts) {
                    if ((self.logAttempts[i].service == serviceType && self.logAttempts[i].action == action)) {
                      self.logAttempts[i].attempts = 0;
                    }
                  }
                  device._auth.chCount = 0;
                  device._auth.sn = nx.Nonce;
                  device._auth.realm = nx.Realm;
                  device._auth.auth = device._calcAuthDigest(
                    device._auth.uid,
                    device._auth.pwd,
                    device._auth.realm,
                    device._auth.sn
                  );
                }
              }
              if (env['s:Body']) {
                let body = env['s:Body'];
                if (body['u:' + action + 'Response']) {
                  self.waitForAuth = {};
                  let responseVars = body['u:' + action + 'Response'];
                  if (outArguments) {
                    outArguments.forEach(function(arg) {
                      res[arg] = responseVars[arg];
                    });
                  }
                } else if (body['s:Fault']) {
                  let fault = body['s:Fault'];
                  let newFault = body['s:Fault'];
                  error = {
                    response: response ? response.statusMessage : 'No message',
                    responseCode: response ? response.statusCode : 'No code',
                    tr064: newFault ? newFault.detail.UPnPError.errorDescription : 'No message',
                    tr064code: newFault ? newFault.detail.UPnPError.errorCode : 'No code',
                    fault: newFault ? newFault.faultstring : 'No message',
                    faultcode: newFault ? newFault.faultcode : 'No code',
                    serviceType: serviceType,
                    action: action
                  };
                  res = fault;
                }
              }
              callback(error, res);
            }
          );
        } else {
          if(body){
            parseString(body,{explicitArray: false,}, function (err, result) {
              if(!err){
                let env = result['s:Envelope'];  
                if(env['s:Body']){
                  let newBody = env['s:Body'];
                  if(newBody['s:Fault']){
                    let fault = newBody['s:Fault'];
                    error = {
                      error: response.statusMessage,
                      errorCode: response.statusCode,
                      tr064: fault ? fault.detail.UPnPError.errorDescription : 'No message',
                      tr064code: fault ? fault.detail.UPnPError.errorCode : 'No code',
                      serviceType: serviceType,
                      action: action,
                      device: device.meta.friendlyName,
                      host: device.meta.host
                    };
                  }
                }  
              } else {
                error = {
                  error: response.statusMessage,
                  errorCode: response.statusCode,
                  serviceType: serviceType,
                  action: action,
                  device: device.meta.friendlyName,
                  host: device.meta.host
                };
              }
            });
            callback(error, null);
          } else {
            error = {
              error: error ? error.errno : response.statusMessage,
              errorCode: error ? error.code : response.statusMessage,
              serviceType: serviceType,
              action: action,
              device: device.meta.friendlyName,
              host: device.meta.host
            };
            callback(error, null);
          }
        }
      }
      );
    } else {
      self.SOAPtimeout = setTimeout(function(){
        self._sendSOAPActionRequest(
          device,
          url,
          serviceType,
          action,
          inArguments,
          outArguments,
          initID,
          vars,
          callback
        );
      },1000);    
    }
  } 
}

exports.Service = Service;
