const parseString = require('xml2js').parseString;
const request = require('request');
const tcpp = require('tcp-ping');

class Service{
  constructor(device, serviceInfo, config, log, callback){
    this.log = log;
    this.host = device.deviceInfo.host;
    this.port = device.deviceInfo.port;
    this.device = device;
    this.deviceInfo = serviceInfo;
    this.deviceInfo.actionsInfo = [];
    this.readyCallback = callback;
    this.actions = {};
    this.stateVariables = {};
    this.config = config;
    this.timeout=config.timeout*1000||5000;
    this._parseSCPD(this);
  }

  _pushArg(argument, inArgs, outArgs){
    if (argument.direction == 'in') {
      inArgs.push(argument.name);
    } else if (argument.direction == 'out') {
      outArgs.push(argument.name);
    }
  }

  _parseActions(actionData){
    const self = this;
    if (!Array.isArray(actionData)) {
      return;
    }
    const insA = self._insertAction.bind(this);
    actionData.forEach(insA);
  }

  _parseSCPD(obj){
    const self = this;
    if (obj.device.deviceInfo.urlPart && obj.device.deviceInfo.urlPart.length > 0) {
      obj.deviceInfo.SCPDURL = obj.deviceInfo.SCPDURL.replace('/tr064', '');
      obj.deviceInfo.SCPDURL = obj.device.deviceInfo.urlPart + obj.deviceInfo.SCPDURL;
    }

    const startUrl = (self.host.match('myfritz') ? 'https://' : 'http://');
    const url = startUrl + obj.host + ':' + obj.port + obj.deviceInfo.SCPDURL;

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

    request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        parseString(body,{explicitArray: false},function(err, result) {
          const pA = self._parseActions.bind(obj);
          const pV = self._parseStateVariables.bind(obj);
          pA(result.scpd.actionList.action);
          pV(result.scpd.serviceStateTable.stateVariable);
          obj.readyCallback(null, obj);
        });
      } else {
        obj.readyCallback(error, null);
      }
    });
  }

  _insertAction(el){
    const self = this;
    const outArgs = [];
    const inArgs = [];
    if (el.argumentList && Array.isArray(el.argumentList.argument)) {
      el.argumentList.argument.forEach(function(argument) {
        self._pushArg(argument, inArgs, outArgs);
      });
    } else if (el.argumentList) {
      self._pushArg(el.argumentList.argument, inArgs, outArgs);
    }

    this.deviceInfo.actionsInfo.push({
      name: el.name,
      inArgs: inArgs,
      outArgs: outArgs,
    });

    this.actions[el.name] = self.bind(this, function(vars, ident, callback) {
      this._callAction(el.name, inArgs, outArgs, vars, ident, callback);
    });

  }

  bind(scope, fn) {
    return function() {
      return fn.apply(scope, arguments);
    };
  }

  _callAction(name, inArguments, outArguments, vars, ident, callback){
    if (typeof vars === 'function') {
      callback = vars;
      vars = [];
    }

    this.bind(this,this._sendSOAPActionRequest(this.device,this.deviceInfo.controlURL,this.deviceInfo.serviceType,name,inArguments,outArguments,vars,ident,callback));
  }

  _insertStateVariables(sv){
    if (sv.$.sendEvents == 'yes') {
      this.stateVariables[sv.name] = this.bind(this, function(callback) {
        this._subscribeStateVariableChangeEvent(sv, callback);
      });
    }
  }

  _parseStateVariables(stateVariableData){
    const insSV = this.bind(this, this._insertStateVariables);
    if (Array.isArray(stateVariableData)) {
      stateVariableData.forEach(insSV);
    } else if (typeof stateVariableData === 'object') {
      insSV(stateVariableData);
    }
  }

  tcp(name, type, service, action, host, port, callback){
    const self = this;
    this.log.debug(name + ': Ping ' + host + ':' + port + ' [' + type + '] - (' + service + ' | ' + action + ')')
    tcpp.probe(host, port, function(err, available) {
      available?self.log.debug(name + ': Ping ' + host + ':' + port + ' [' + type + '] - (' + service + ' | ' + action + ') --> SUCCESFULL'):self.log.debug(name + ': Ping ' + host + ':' + port + ' [' + type + '] - (' + service + ' | ' + action + ') --> ERROR');
      callback(available);
    });
  }
  _sendSOAPActionRequest(device,url,serviceType,action,inArguments,outArguments,vars,ident,callback){	  
	const that = this;
    this.tcp(ident.name, device.config.type, serviceType, action, device.config.host,device.config.port,function(available){
      if(available){
        let head = '';
        // Content Level Authentication
        if (device._auth.auth) {
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
          agentOptions = {rejectUnauthorized: false}; 
        } else {
          proto = 'http://';
          port = device.deviceInfo.port;
        }
        const uri = proto + device.deviceInfo.host + ':' + port + url;
        let options = {
          method: 'POST',
          uri: uri,
          agentOptions: agentOptions,
          headers: {
            SoapAction: serviceType + '#' + action,
            'Content-Type': 'text/xml; charset="utf-8"',
          },
          pool: {maxSockets: Infinity},
          body: body,
          timeout: that.config.timeout,
          agent: false
        };
        request(options,function(error, response, body) {
          if (!error && response.statusCode == 200) {
            parseString(body,{explicitArray: false},function(err, result) {
              var res = {};
              var env = result['s:Envelope'];
              if (env['s:Header']) {
                var header = env['s:Header'];
                if (header['h:Challenge']) {
                  //Req authentication
                  var ch = header['h:Challenge'];
                  if(ch.Status == 'Unauthenticated' && ch.Nonce && ident.count < 2){
                    device._auth.des = serviceType;
                    device._auth.sn = ch.Nonce;
                    device._auth.realm = ch.Realm;
                    device._auth.auth = device._calcAuthDigest(device._auth.uid,device._auth.pwd,device._auth.realm,device._auth.sn);
                    device._auth.chCount++;
                    ident.count++;
                    setTimeout(function(){that._sendSOAPActionRequest(device,url,serviceType,action,inArguments,outArguments,vars,ident,callback);},500);
                    return;
                  } else {
                    error = new Error('Credentials incorrect');
                  }
                } else if (header['h:NextChallenge']) {
                  //Authenticated
                  var nx = header['h:NextChallenge'];
                  device._auth.auth = nx.Nonce;
                  device._auth.chCount = 0;
                  device._auth.sn = nx.Nonce;
                  device._auth.realm = nx.Realm;
                  device._auth.auth = device._calcAuthDigest(device._auth.uid,device._auth.pwd,device._auth.realm,device._auth.sn);
                }
              }
              if (env['s:Body']) {
                var body = env['s:Body'];
                if (body['u:' + action + 'Response']) { //Authenticated
                  var responseVars = body['u:' + action + 'Response'];
                  if (outArguments) {
                    outArguments.forEach(function(arg) {
                      res[arg] = responseVars[arg];
                    });
                  }
                } else if (body['s:Fault']) { //Not authenticated or error
                  var fault = body['s:Fault'];
                  error = {
                    desc: 'Error by authentication',
                    tr064: fault ? fault.detail.UPnPError.errorDescription : 'No message',
                    tr064code: fault ? fault.detail.UPnPError.errorCode : 'No code',
                    fault: fault ? fault.faultstring : 'No message',
                    faultcode: fault ? fault.faultcode : 'No code',
                    serviceType: serviceType,
                    action: action
                  };
                  res = error;
                }
              }
              callback(null, res);
            });
          } else {
            if(error){
              error = {
                error: error ? error.code : 'No message',
                errorCode: error ? error.code : 'No code',
                serviceType: serviceType,
                action: action
              };
            } else {
              parseString(response.body,{explicitArray: false,}, function (err, result) {
                if(!err){
                  let env = result['s:Envelope'];
                  if(env['s:Body']){
                    let newBody = env['s:Body'];
                    if(newBody['s:Fault']){
                      let fault = newBody['s:Fault'];
                      error = {
                        error: error ? error.errno : 'No message',
                        errorCode: error ? error.errno : 'No code',
                        tr064: fault ? fault.detail.UPnPError.errorDescription : 'No message',
                        tr064code: fault ? fault.detail.UPnPError.errorCode : 'No code',
                        fault: fault ? fault.faultstring : 'No message',
                        faultcode: fault ? fault.faultcode : 'No code',
                        serviceType: serviceType,
                        action: action
                      };
                    }
                  }
                } else {
                  error = {
                    error: error ? error.errno : 'No message',
                    errorCode: error ? error.errno : 'No code',
                    serviceType: serviceType,
                    action: action
                  };
                }
              });
            }
            callback(error, null);
          }
        });
      } else {
        let error = {
          ping: true
        };
        callback(error, null);
      }
    });
  } 
}

exports.Service = Service;