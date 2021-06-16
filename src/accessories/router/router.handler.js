'use strict';

const { requestLUA } = require('@seydx/fritzbox/lib/request');
const logger = require('../../utils/logger');
const { initReboot } = require('./router.utils');
const Telegram = require('../../lib/telegram');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

class Handler {
  constructor() {
    this.configured = false;
  }

  configure(api, accessories, polling, meshMaster) {
    if (this.configured) {
      return this;
    }

    this.api = api;
    this.accessories = accessories;
    this.polling = polling;
    this.fritzbox = meshMaster.fritzbox;

    this.configured = true;

    this.poll();

    return this;
  }

  async change(context, accessory, subtype) {
    if (context.oldValue !== context.newValue) {
      subtype = subtype || accessory.context.config.subtype;
      const config = accessory.context.config;
  
      if (!this.configured) {
        logger.debug('Router: Handler not configured yet. Skipping CHANGE event.');
        return;
      }
  
      switch (subtype) {
        case 'dsl':
        case 'cable':
          if (!config.readOnly) {
            Telegram.send('reboot', context.newValue ? 'finish' : 'start', `${accessory.displayName} (${subtype})`);
          }
          break;
        case 'repeater':
          break;
        case 'wifi_2ghz':
          break;
        case 'wifi_5ghz':
          break;
        case 'wifi_guest':
          break;
        case 'wps':
          break;
        case 'led':
          break;
        case 'lock':
          break;
        case 'broadband':
          break;
        case 'deflection':
          break;
        case 'aw':
          break;
        case 'dect':
          break;
        default:
          logger.warn(
            `Can not handle CHANGE event. Unknown accessory subtype (${subtype})`,
            `${accessory.displayName} (${subtype})`
          );
          break;
      }
    }
  }

  async get(accessory, subtype, ownCharacteristic) {
    subtype = subtype || accessory.context.config.subtype;
    const config = accessory.context.config;

    let fritzbox = config.fritzbox || this.fritzbox;
    let characteristic = ownCharacteristic ? ownCharacteristic : this.api.hap.Characteristic.On;
    let state = accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).value;

    if (!this.configured) {
      logger.debug('Router: Handler not configured yet. Skipping GET event.');
      return state;
    }

    switch (subtype) {
      case 'dsl': {
        try {
          const response = await fritzbox.exec('urn:WANPPPConnection-com:serviceId:WANPPPConnection1', 'GetInfo');
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response.NewConnectionStatus === 'Connected';

          if (accessory.context.restart) {
            accessory.context.restart = false;

            if (config.reboot.off && accessory.context.config.master) {
              try {
                logger.info('Executing OFF script...', `${accessory.displayName} (${subtype})`);

                await initReboot(config.reboot.off);

                logger.info('OFF script executed successfully!', `${accessory.displayName} (${subtype})`);
              } catch (err) {
                logger.error('An error occured during executing OFF script!', `${accessory.displayName} (${subtype})`);
                logger.error(err);
              }
            }
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'cable': {
        try {
          const response = await fritzbox.exec('urn:WANIPConnection-com:serviceId:WANIPConnection1', 'GetInfo');
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response.NewConnectionStatus === 'Connected';

          if (accessory.context.restart) {
            accessory.context.restart = false;

            if (config.reboot.off && accessory.context.config.master) {
              try {
                logger.info('Executing OFF script...', `${accessory.displayName} (${subtype})`);

                await initReboot(config.reboot.off);

                logger.info('OFF script executed successfully!', `${accessory.displayName} (${subtype})`);
              } catch (err) {
                logger.error('An error occured during executing OFF script!', `${accessory.displayName} (${subtype})`);
                logger.error(err);
              }
            }
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'repeater': {
        try {
          const response = await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration1', 'GetInfo');
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response.NewEnable === '1';
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'wifi_2ghz': {
        try {
          const response = await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration1', 'GetInfo');
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response.NewEnable === '1';
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'wifi_5ghz': {
        try {
          const response = await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration2', 'GetInfo');
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response.NewEnable === '1';
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'wifi_guest': {
        try {
          const response = await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration3', 'GetInfo');
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response.NewEnable === '1';
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'wps': {
        try {
          const response = await fritzbox.exec(
            'urn:WLANConfiguration-com:serviceId:WLANConfiguration1',
            'X_AVM-DE_GetWPSInfo'
          );
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response['NewX_AVM-DE_WPSStatus'] === 'on';
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'dect': {
        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          const body = await requestLUA(
            {
              xhr: '1',
              sid: sid,
              page: 'dectSet',
              no_sidrenew: '',
            },
            fritzbox.url.hostname,
            '/data.lua',
            'dect_activ'
          );

          logger.debug(body, `${accessory.displayName} (${subtype})`);

          state = body.checked || body.checked === '';
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'aw': {
        try {
          const response = await fritzbox.exec('urn:X_AVM-DE_TAM-com:serviceId:X_AVM-DE_TAM1', 'GetInfo', {
            NewIndex: '0',
          });
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          state = response.NewEnable === '1';
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'deflection': {
        try {
          let response = await fritzbox.exec(
            'urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1',
            'GetNumberOfDeflections'
          );
          logger.debug(response, `${accessory.displayName} (${subtype})`);
          const enabled = parseInt(response.NewNumberOfDeflections);

          if (enabled) {
            response = await fritzbox.exec('urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1', 'GetDeflection', {
              NewDeflectionId: '0',
            });
            logger.debug(response, `${accessory.displayName} (${subtype})`);
            state = response.NewEnable === '1';
          } else {
            state = false;
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'led': {
        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          const body = await requestLUA(
            {
              xhr: '1',
              xhrId: 'all',
              sid: sid,
              page: 'led',
            },
            fritzbox.url.hostname,
            '/data.lua'
          );

          logger.debug(body, `${accessory.displayName} (${subtype})`);

          if (body?.data?.ledSettings) {
            state = parseInt(body?.data?.ledSettings?.ledDisplay) === 0;
          }

          //old fw
          if (body?.data?.led_display) {
            state = parseInt(body?.data?.led_display) === 0;
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'lock': {
        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          const body = await requestLUA(
            {
              xhr: '1',
              xhrId: 'all',
              sid: sid,
              page: 'keyLo',
              no_sidrenew: '',
            },
            fritzbox.url.hostname,
            '/data.lua'
          );

          logger.debug(body, `${accessory.displayName} (${subtype})`);

          if (body?.data) {
            state = body?.data?.keylock_checked || false;
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'broadband': {
        let maxDl = accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.Download).value;

        let maxUl = accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.Upload).value;

        try {
          const response = await fritzbox.exec(
            'urn:WANCIfConfig-com:serviceId:WANCommonInterfaceConfig1',
            'X_AVM-DE_GetOnlineMonitor',
            { NewSyncGroupIndex: 0 }
          );
          logger.debug(response, `${accessory.displayName} (${subtype})`);

          maxDl = `${(parseInt(response.Newmax_ds) / 125000).toFixed(2)} Mbit/s`;
          maxUl = `${(parseInt(response.Newmax_us) / 125000).toFixed(2)} Mbit/s`;
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.Download)
          .updateValue(maxDl);

        accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.Upload)
          .updateValue(maxUl);

        return maxDl;
      }
      default:
        logger.warn(
          `Can not handle GET event. Unknown accessory subtype (${subtype})`,
          `${accessory.displayName} (${subtype})`
        );
        break;
    }

    return state;
  }

  async set(state, accessory, subtype, ownCharacteristic) {
    subtype = subtype || accessory.context.config.subtype;
    const config = accessory.context.config;

    let fritzbox = config.fritzbox || this.fritzbox;
    let characteristic = ownCharacteristic ? ownCharacteristic : this.api.hap.Characteristic.On;

    if (!this.configured) {
      logger.debug('Router: Handler not configured yet. Skipping SET event.');
      return;
    }

    switch (subtype) {
      case 'dsl': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        if (state) {
          logger.info(`ON not supported! (${subtype})`, `${accessory.displayName} (${subtype})`);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        } else {
          if (config.reboot.on && config.master) {
            try {
              logger.info('Executing ON script...', `${accessory.displayName} (${subtype})`);

              await initReboot(config.reboot.off);

              logger.info('ON script executed successfully!', `${accessory.displayName} (${subtype})`);
            } catch (err) {
              logger.error('An error occured during executing ON script!', `${accessory.displayName} (${subtype})`);
              logger.error(err);
            }
          }

          try {
            await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'Reboot');

            accessory.context.restart = true;
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);

            setTimeout(() => {
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
            }, 1000);
          }
        }
        break;
      }
      case 'cable': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        if (state) {
          logger.info(`ON not supported! (${subtype})`, `${accessory.displayName} (${subtype})`);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        } else {
          if (config.reboot.on && config.master) {
            try {
              logger.info('Executing ON script...', `${accessory.displayName} (${subtype})`);

              await initReboot(config.reboot.off);

              logger.info('ON script executed successfully!', `${accessory.displayName} (${subtype})`);
            } catch (err) {
              logger.error('An error occured during executing ON script!', `${accessory.displayName} (${subtype})`);
              logger.error(err);
            }
          }

          try {
            await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'Reboot');

            accessory.context.restart = true;
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);

            setTimeout(() => {
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
            }, 1000);
          }
        }
        break;
      }
      case 'repeater': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        if (state) {
          logger.info(`ON not supported! (${subtype})`, `${accessory.displayName} (${subtype})`);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        } else {
          try {
            await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'Reboot');
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);

            setTimeout(() => {
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
            }, 1000);
          }
        }
        break;
      }
      case 'wifi_2ghz': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration1', 'SetEnable', {
            NewEnable: state,
          });
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'wifi_5ghz': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration2', 'SetEnable', {
            NewEnable: state,
          });
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'wifi_guest': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration3', 'SetEnable', {
            NewEnable: state,
          });
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'wps': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);
        let status = state ? 'pbc' : 'stop';

        try {
          await fritzbox.exec('urn:WLANConfiguration-com:serviceId:WLANConfiguration1', 'X_AVM-DE_SetWPSConfig', {
            'NewX_AVM-DE_WPSMode': status,
          });
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'dect': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          let formData;

          if (state) {
            formData = {
              xhr: '1',
              sid: sid,
              no_sidrenew: '',
              dect_activ: 'on',
              dect_pin: '****',
              dect_eco_modi: '1',
              starthh: '00',
              startmm: '00',
              endhh: '00',
              endmm: '00',
              dect_security: '0',
              protectpin: '',
              protectdiversion: 'on',
              dect_problems: 'on',
              catiq_problems: 'on',
              dect_assi: '0',
              btnSave: '',
              oldpage: '/dect/dect_settings.lua',
            };
          } else {
            formData = {
              xhr: '1',
              sid: sid,
              no_sidrenew: '',
              dect_assi: '0',
              btnSave: '',
              oldpage: '/dect/dect_settings.lua',
            };
          }

          await requestLUA(formData, fritzbox.url.hostname, '/data.lua');
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'aw': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          await fritzbox.exec('urn:X_AVM-DE_TAM-com:serviceId:X_AVM-DE_TAM1', 'SetEnable', {
            NewIndex: 0,
            NewEnable: state ? '1' : '0',
          });
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'deflection': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          let data = await fritzbox.exec('urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1', 'GetNumberOfDeflections');

          if (parseInt(data.NewNumberOfDeflections)) {
            try {
              await fritzbox.exec('urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1', 'SetDeflectionEnable', {
                NewDeflectionId: 0,
                NewEnable: state ? 1 : 0,
              });
            } catch (err) {
              logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
              logger.error(err);

              setTimeout(() => {
                accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
              }, 1000);
            }
          } else {
            logger.warn('Can not set state, no deflections found', `${accessory.displayName} (${subtype})`);

            setTimeout(() => {
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
            }, 1000);
          }
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'led': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          let formData = {
            xhr: '1',
            led_brightness: '2',
            environment_light: '1',
            led_display: state ? '0' : '2',
            envLight: '1',
            dimValue: '2',
            ledDisplay: state ? '0' : '2',
            apply: '',
            sid: sid,
            page: 'led',
            event: '14',
          };

          if (config.oldFW) {
            formData = {
              xhr: '1',
              led_display: state ? '0' : '2',
              apply: '',
              sid: sid,
              page: 'led',
              event: '14',
            };
          }

          await requestLUA(formData, fritzbox.url.hostname, '/data.lua');
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'lock': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          await requestLUA(
            {
              xhr: '1',
              keylock_enabled: state ? '1' : '0',
              sid: sid,
              menu_active_page: 'keyLo',
              apply: '',
              page: 'keyLo',
            },
            fritzbox.url.hostname,
            '/data.lua'
          );
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(() => {
            accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state);
          }, 1000);
        }
        break;
      }
      case 'broadband': {
        //no SET event
        break;
      }
      default:
        logger.warn(
          `Can not handle SET event. Unknown accessory subtype (${subtype})`,
          `${accessory.displayName} (${subtype})`
        );
        break;
    }
  }

  async poll() {
    await timeout(1000); //wait for accessories to fully load
    logger.debug('Polling ROUTER accessories');

    const ExtrasHandler = require('../extras/extras.handler');

    try {
      const characteristics = {
        '0026e147-5d51-4f42-b157-6aca6050be8e': {
          name: 'WifiTwo',
          subtype: 'wifi_2ghz',
        },
        'a72aeeca-c6ce-45ce-b026-5d400aab5fc9': {
          name: 'WifiFive',
          subtype: 'wifi_5ghz',
        },
        'a87bbf2b-885c-4713-8169-22abdbf0b2a1': {
          name: 'WifiGuest',
          subtype: 'wifi_guest',
        },
        '991dd58c-7d8c-46b1-acd1-411d8f6902ac': {
          name: 'WifiWPS',
          subtype: 'wps',
        },
        '1718fc65-453b-403a-ab81-79a1c96ba195': {
          name: 'DECT',
          subtype: 'dect',
        },
        'd19ef9d5-3bc6-47ac-b6bb-7bdcf0df20b0': {
          name: 'AnsweringMachine',
          subtype: 'aw',
        },
        '658086c7-274c-4988-bd5e-3c720fa3054d': {
          name: 'Deflection',
          subtype: 'deflection',
        },
        'fd81f0dc-4324-457e-8164-289743873fb1': {
          name: 'DeviceLED',
          subtype: 'led',
        },
        '56af4239-46bc-4bae-b55b-dbc5be2d0897': {
          name: 'DeviceLock',
          subtype: 'lock',
        },
        'cab7d43e-422c-4452-bc9a-11c89454332b': {
          name: 'RingLock',
          subtype: 'ringlock',
        },
      };

      const validUUIDs = Object.keys(characteristics).map((uuid) => uuid);
      const accessories = this.accessories.filter((accessory) => accessory.context.config.type === 'router');

      for (const accessory of accessories) {
        if (!this.polling.exclude.includes(accessory.displayName)) {
          await this.get(accessory);
        }

        for (const service of accessory.services) {
          if (service.subtype === 'dsl' || service.subtype === 'cable' || service.subtype === 'repeater') {
            for (const characteristic of service.characteristics) {
              if (!this.polling.exclude.includes(characteristics[characteristic.UUID]?.subtype)) {
                if (
                  validUUIDs.includes(characteristic.UUID) &&
                  characteristics[characteristic.UUID].name === 'RingLock'
                ) {
                  await ExtrasHandler.get(
                    accessory,
                    characteristics[characteristic.UUID].subtype,
                    this.api.hap.Characteristic[characteristics[characteristic.UUID].name]
                  );
                } else if (validUUIDs.includes(characteristic.UUID)) {
                  await this.get(
                    accessory,
                    characteristics[characteristic.UUID].subtype,
                    this.api.hap.Characteristic[characteristics[characteristic.UUID].name]
                  );
                }
              }
            }
          }
        }
      }
    } catch (err) {
      logger.warn('An error occurred during polling router/characteristics!');
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), (this.polling.timer - 1) * 1000);
    }
  }
}

const handler = new Handler();
module.exports = handler;
