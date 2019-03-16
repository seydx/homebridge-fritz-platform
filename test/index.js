const tr = require('../lib/TR064.js');
const request = require('request');
const parseString = require('xml2js').parseString;
const self = this;

let options = {
  host: '192.168.178.1', //IP HERE
  port: 49000,
  ssl: true,
  username: 'Seyd55', //USERNAME HERE
  password: 'Samsun55', //PASSWORD HERE
  headers: {
    'Content-Type': 'text/xml; charset="utf-8"'
  }
};

const input = process.stdin;
input.setEncoding('utf-8');
console.log('Please input text in command line (smarthome | presence)');
input.on('data', function (data) {
  if(data === 'exit\n'){
    console.log('User input complete, program exit.');
    process.exit();
  }else{
    initTR064(options, data);
  }
});

function initTR064(config, data){
  self.tr064 = new tr.TR064(config);
  self.tr064.initDevice()
    .then(result => {
      self.device = result;
      secureLog(result, data);
    })
    .catch(err => {
      console.log('An error occured by initializing device!');
      console.log(err);
      console.log('');
      console.log('Please input text in command line (smarthome | presence)');
    });
}

function secureLog(device, data){
  device.startEncryptedCommunication()
    .then(res => {
      res.login(device.config.username,device.config.password);
      console.log('Encrypted communication started with: %s',res.deviceInfo.friendlyName);
      self.device = res;
      fetchNewSID(res, data);
    })
    .catch(err => {
      console.log('An error occured by starting encypted communication with: %s',device.deviceInfo.friendlyName);
      console.log(err);
      console.log('');
      console.log('Please input text in command line (smarthome | presence)');
    });
}

function fetchNewSID(device, data){
  let config = device.services['urn:dslforum-org:service:DeviceConfig:1'];
  config.actions['X_AVM-DE_CreateUrlSID'](null,{name:'fetchSID',count:0},function(err, result) {
    if(result){
      let sid = result['NewX_AVM-DE_UrlSID'].split('sid=')[1];
      switch (data){
        case 'smarthome\n':
          getDevices(device,sid);
          break;
        case 'presence\n':
          getHosts(device);
          break;
        default:
          'Enter valid parameter!';
      }
    } else {
      console.log(err);
      console.log('');
      console.log('Please input text in command line (smarthome | presence)');
    }
  });
}

function getDevices(device, sid){
  let cmd = 'getdevicelistinfos';
  let url = 'http://'+device.config.host+'/webservices/homeautoswitch.lua?switchcmd='+cmd+'&sid='+sid;
  let opt = {
    uri: url,
    method: 'GET',
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  };
  request(opt,function(error, response, body) {
    if (!error && response.statusCode == 200) {
      parseString(body,{explicitArray: false},function(err, result) {
        console.log('');
        console.log('########### 1 ############');
        console.log('');
        console.log(result);
        console.log('');
        console.log('########### 2 ############');
        console.log('');
        console.log(result.devicelist);
        console.log('');
        console.log('########### 3 ############');
        console.log('');
        console.log(result.devicelist.device);
        
        console.log('');
        console.log('Please input text in command line (smarthome | presence)');
      });
    } else {
      if(!error){
        console.log(response);
      } else {
        console.log(error);
      }
      console.log('');
      console.log('Please input text in command line (smarthome | presence)');
    }
  });
}

function getHosts(device){
  let hosts = device.services['urn:dslforum-org:service:Hosts:1'];
  hosts.actions['X_AVM-DE_GetHostListPath'](null,{name:'lol',count:0},function(err, result) {
    if(!err||result){
      getData(device, result['NewX_AVM-DE_HostListPath']);
    } else {
      console.log(err);
      console.log('');
      console.log('Please input text in command line (smarthome | presence)');
    }
  });
}

function getData(device, link){
  let uri = 'http://'+options.host+':'+options.port+link;
  let opt = {
    uri: uri,
    method: 'GET',
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  };
  request(opt,function(error, response, body) {
    if (!error && response.statusCode == 200) {
      parseString(body,{explicitArray: false},function(err, result) {
        console.log('');
        console.log('########### 1 ############');
        console.log('');
        console.log(result); 
        console.log('');
        console.log('########### 2 ############');
        console.log('');
        console.log(result.List);
        console.log('');
        console.log('########### 3 ############');
        console.log('');
        console.log(result.List.Item);
        console.log('');
        console.log('Please input text in command line (smarthome | presence)');
      });
    } else {
      if(response){
        console.log(response.statusCode);
      } else {
        console.log(error);
      }
      console.log('');
      console.log('Please input text in command line (smarthome | presence)');
    }
  });
}