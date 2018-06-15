var parseString = require('xml2js').parseString;

class Service{
  constructor(device, serviceInfo, config, log, callback){
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
    this.timeout=config.timeout*1000||10000;
    this.waitForAuth = {};
    this.getContent = function(url) {
      return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? require('https') : require('http');
        const request = lib.get(url, (response) => {
          if (response.statusCode < 200 || response.statusCode > 299) {
            reject(new Error('Failed to load data, status code: ' + response.statusCode));
          }
          const body = [];
          response.on('data', (chunk) => body.push(chunk));
          response.on('end', () => resolve(body.join('')));
        });
        request.on('error', (err) => reject(err));
      });
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
      obj.meta.SCPDURL = obj.device.meta.urlPart + '/' + obj.meta.SCPDURL;
    }
    var url = 'http://' + obj.host + ':' + obj.port + obj.meta.SCPDURL;
    self.getContent(url)
      .then(data => {
        parseString(data,{explicitArray: false},function(err, result) {
          var pA = self._parseActions.bind(obj);
          pA(result.scpd.actionList.action);
          obj.readyCallback(null, obj);
        });
      })
      .catch(err => {
        obj.readyCallback(err, null);
      });
  }

  _parseActions(actionData){
    const self = this;
    if (!Array.isArray(actionData)) {
      return;
    }
    var insA = self._insertAction.bind(this);
    actionData.forEach(insA);
  }
  
  _insertAction(el){
    const self = this;
    var outArgs = [];
    var inArgs = [];
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
    if (typeof vars === 'function') {
      callback = vars;
      vars = [];
    }

    this.bind(
      this,
      this._sendSOAPActionRequest(
        this.device,
        this.meta.controlURL,
        this.meta.serviceType,
        name,
        inArguments,
        outArguments,
        vars,
        callback
      )
    );
  }

  _sendSOAPActionRequest(device,url,serviceType,action,inArguments,outArguments,vars,callback){
    const self = this;
    if(self.SOAPtimeout)clearTimeout(self.SOAPtimeout);
    let devID = (vars[0]&&vars[0].id) ? vars[0].id : 0;
    if(!Object.keys(self.waitForAuth).length||
    (serviceType==self.waitForAuth.serviceType&&
     action==self.waitForAuth.action&&
     vars==self.waitForAuth.vars&&
     url==self.waitForAuth.url&&
     inArguments==self.waitForAuth.inArguments&&
     outArguments==self.waitForAuth.outArguments&&
     devID==self.waitForAuth.id)){
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
            id: devID
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
      var body = '<?xml version="1.0" encoding="utf-8"?>' +
               '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s=" http://schemas.xmlsoap.org/soap/envelope/">' +
               head +
               '<s:Body>' +
               '<u:' +
               action +
               ' xmlns:u="' +
               serviceType +
               '">';
               
      for (var i in vars) {
        if(vars[i].name&&vars[i].value){
          body += '<' + vars[i].name + '>';
          body += vars[i].value;
          body += '</' + vars[i].name + '>';
        }
      }
      body = body + '</u:' + action + '>' + '</s:Body>' + '</s:Envelope>';
      var port = 0,
        proto = '';
      if (device._sslPort) {
        port = device._sslPort;
        proto = 'https://';
      } else {
        proto = 'http://';
        port = device.meta.port;
      }
      var that = this;
      
      let postData = body;
      
      let options = {
        method: 'POST',
        host: device.meta.host,
        port: port,
        path: url,
        headers: {
          SoapAction: serviceType + '#' + action,
          'Content-Type': 'text/xml; charset="utf-8"',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: self.config.timeout
      };
      
      device._ca ? options.ca = device._ca : options.rejectUnauthorized = false;
      
      let http = proto.startsWith('https') ? require('https') : require('http');
      const req = http.request(options, (response) => {
        response.setEncoding('utf8');
        response.on('data', (body) => {
          if(response.statusCode == 200){
            parseString(
              body,
              {
                explicitArray: false,
              },
              function(err, result) {
                var res = {};
                var env = result['s:Envelope'];
                if (env['s:Header']) {
                  var header = env['s:Header'];
                  if (header['h:Challenge']) {
                    var ch = header['h:Challenge'];
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
                      // Repeat request.
                      that._sendSOAPActionRequest(
                        device,
                        url,
                        serviceType,
                        action,
                        inArguments,
                        outArguments,
                        vars,
                        callback
                      );
                      return;
                    }
                  } else if (header['h:NextChallenge']) {
                    var nx = header['h:NextChallenge'];
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
                let error;
                if (env['s:Body']) {
                  var body = env['s:Body'];
                  if (body['u:' + action + 'Response']) {
                    self.waitForAuth = {};
                    var responseVars = body['u:' + action + 'Response'];
                    if (outArguments) {
                      outArguments.forEach(function(arg) {
                        res[arg] = responseVars[arg];
                      });
                    }
                  } else if (body['s:Fault']) {
                    var fault = body['s:Fault'];
                    let newFault = body['s:Fault'];
                    error = {
                      response: response ? response.statusMessage : 'No message',
                      responseCode: response ? response.statusCode : 'No code',
                      tr064: newFault ? newFault.detail.UPnPError.errorDescription : 'No message',
                      tr064code: newFault ? newFault.detail.UPnPError.errorCode : 'No code',
                      fault: newFault ? newFault.faultstring : 'No message',
                      faultcode: newFault ? newFault.faultcode : 'No code',
                      serviceType: serviceType,
                      action: action,
                      device: device.meta.friendlyName,
                      host: device.meta.host
                    };
                    res = fault;
                  }
                }
                callback(error, res);
              }
            );
          } else {
            let error;
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
                        fault: fault ? fault.faultstring : 'No message',
                        faultcode: fault ? fault.faultcode : 'No code',
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
                error: response.statusMessage,
                errorCode: response.statusCode,
                serviceType: serviceType,
                action: action,
                device: device.meta.friendlyName,
                host: device.meta.host
              };
              callback(error, null);
            }
          }
        });
      });
      
      req.on('error', (e) => {
        let error = {
          error: e.message,
          errorCode: e.code,
          serviceType: serviceType,
          action: action,
          device: device.meta.friendlyName,
          host: device.meta.host
        };
        callback(error, null);
      });
  
      req.write(postData);
      req.end();
  
    } else {
      self.SOAPtimeout = setTimeout(function(){
        self._sendSOAPActionRequest(
          device,
          url,
          serviceType,
          action,
          inArguments,
          outArguments,
          vars,
          callback
        );
      },500);  
    }
  } 
}

exports.Service = Service;
