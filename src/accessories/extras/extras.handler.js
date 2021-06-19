'use strict';

const fs = require('fs-extra');
const moment = require('moment');
const { requestLUA, requestXml } = require('@seydx/fritzbox/lib/request');
const logger = require('../../utils/logger');
const Telegram = require('../../lib/telegram');

class Handler {
  constructor() {
    this.alarmTimeout = null;
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
    this.configPath = api.user.storagePath();
    this.cityPrefix = meshMaster.cityPrefix;
    this.countryPrefix = meshMaster.countryPrefix;

    this.configured = true;

    setTimeout(() => this.poll(), 1000);

    return this;
  }

  // eslint-disable-next-line no-unused-vars
  async change(context, accessory, subtype, historyService) {
    if (context.oldValue !== context.newValue) {
      if (!this.configured) {
        logger.debug(
          'Handler not configured yet. Skipping CHANGE event.',
          `${accessory.displayName} (${accessory.context.config.subtype})`
        );
        return;
      }

      subtype = subtype || accessory.context.config.subtype;

      switch (subtype) {
        case 'alarm':
          Telegram.send(
            'alarm',
            context.newValue ? 'activated' : 'deactivated',
            `${accessory.displayName} (${subtype})`
          );
          break;
        case 'phoneBook':
          break;
        case 'ringlock':
          break;
        case 'wakeup':
          break;
        case 'dnsServer':
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
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping GET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return false;
    }

    subtype = subtype || accessory.context.config.subtype;

    let fritzbox = accessory.context.config.fritzbox || this.fritzbox;
    let characteristic = ownCharacteristic ? ownCharacteristic : this.api.hap.Characteristic.On;
    let state = accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).value;

    if (accessory.context.busy) {
      return state;
    }

    switch (subtype) {
      case 'alarm':
        break;
      case 'phoneBook':
        break;
      case 'ringlock': {
        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');

          let sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];
          let phonesFormData = [];
          let actives = [];

          for (let count = 1; count <= accessory.context.config.extras[subtype].DECTphones; count++)
            phonesFormData.push({
              xhr: '1',
              idx: count.toString(),
              sid: sid,
              no_sidrenew: '',
              popup_url: '',
              oldpage: '/fon_devices/edit_dect_ring_block.lua',
            });

          for (const formData of phonesFormData) {
            logger.debug(`GET CMD: ${JSON.stringify(formData)}`, `${accessory.displayName} (${subtype})`);
            const body = await requestLUA(formData, fritzbox.url.hostname, '/data.lua', 'nightsetting');
            logger.debug(body, `${accessory.displayName} (${subtype})`);

            actives.push(body.checked && body.checked === 'checked' ? 1 : 0);
          }

          state = actives.includes(1) ? true : false;
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
      }
      case 'wakeup':
        break;
      case 'dnsServer': {
        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          let formData = {
            xhr: '1',
            xhrId: 'all',
            sid: sid,
            page: 'dnsSrv',
          };

          logger.debug(`GET CMD: ${JSON.stringify(formData)}`, `${accessory.displayName} (${subtype})`);
          const body = await requestLUA(formData, fritzbox.url.hostname, '/data.lua');
          logger.debug(body, `${accessory.displayName} (${subtype})`);

          if (body && body.data && body.data.vars && body.data.vars.ipv4 && body.data.vars.ipv4.userdns) {
            state = parseInt(body.data.vars.ipv4.userdns.value) === 1;
          }
        } catch (err) {
          logger.warn('An error occured during getting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);
        }

        accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(state);

        return state;
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
    if (!this.configured) {
      logger.debug(
        'Handler not configured yet. Skipping SET event.',
        `${accessory.displayName} (${accessory.context.config.subtype})`
      );
      return;
    }

    subtype = subtype || accessory.context.config.subtype;

    let fritzbox = accessory.context.config.fritzbox || this.fritzbox;
    let characteristic = ownCharacteristic ? ownCharacteristic : this.api.hap.Characteristic.On;

    accessory.context.busy = true;

    switch (subtype) {
      case 'alarm': {
        try {
          if (state) {
            logger.info('ON', `${accessory.displayName} (${subtype})`);

            await fritzbox.exec('urn:X_VoIP-com:serviceId:X_VoIP1', 'X_AVM-DE_DialNumber', {
              'NewX_AVM-DE_PhoneNumber': accessory.context.config.extras[subtype].telNr,
            });

            let duration = accessory.context.config.extras[subtype].duration || 30;

            if (
              accessory.context.config.extras[subtype].duration &&
              parseInt(accessory.context.config.extras[subtype].duration) > 0
            ) {
              if (this.alarmTimeout) {
                clearTimeout(this.alarmTimeout);
                this.alarmTimeout = null;
              }

              this.alarmTimeout = setTimeout(() => {
                let value = accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).value;

                if (value) {
                  accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).setValue(false);
                }
              }, duration * 1000);
            }
          } else {
            logger.info('OFF', `${accessory.displayName} (${subtype})`);

            if (this.alarmTimeout) {
              clearTimeout(this.alarmTimeout);
              this.alarmTimeout = null;
            }

            await fritzbox.exec('urn:X_VoIP-com:serviceId:X_VoIP1', 'X_AVM-DE_DialHangup');
          }
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(
            () =>
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state),
            1000
          );
        }
        break;
      }
      case 'phoneBook': {
        if (!state) {
          return;
        } else {
          try {
            let lkz, okz;

            if (this.countryPrefix) {
              let prefix = this.countryPrefix;

              if (prefix.includes('+')) {
                lkz = prefix.split('+')[1];
              }

              if (prefix.includes('00')) {
                lkz = prefix.split('00')[1];
              }
            } else {
              lkz = await fritzbox.exec('urn:X_VoIP-com:serviceId:X_VoIP1', 'X_AVM-DE_GetVoIPCommonCountryCode');
              lkz = lkz['NewX_AVM-DE_LKZ']; //49 => 0049 => +49
            }

            if (this.cityPrefix) {
              if (this.cityPrefix.indexOf('0') === 0) {
                okz = this.cityPrefix.replace('0', '');
              }
            } else {
              okz = await fritzbox.exec('urn:X_VoIP-com:serviceId:X_VoIP1', 'X_AVM-DE_GetVoIPCommonAreaCode');
              okz = okz['NewX_AVM-DE_OKZ']; //531
            }

            let lkz1 = '+' + lkz;
            let lkz2 = '00' + lkz;
            let okz1 = '0' + okz;

            const telBook = [];
            const blackBook = [];
            const blacklists =
              accessory.context.config.extras[subtype].blacklists &&
              accessory.context.config.extras[subtype].blacklists.length
                ? accessory.context.config.extras[subtype].blacklists
                : [];

            let books = await fritzbox.exec('urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1', 'GetPhonebookList');
            books = books.NewPhonebookList.split(',');

            if (!Array.isArray(books)) {
              books = [books];
            }

            logger.debug(
              `Found ${books.length} phonebook(s). Fetching entries...`,
              `${accessory.displayName} (${subtype})`
            );

            for (const id of books) {
              let data = await fritzbox.exec('urn:X_AVM-DE_OnTel-com:serviceId:X_AVM-DE_OnTel1', 'GetPhonebook', {
                NewPhonebookID: id,
              });

              let bookName = data.NewPhonebookName;
              let uri = data.NewPhonebookURL;
              let book = await requestXml(uri, { https: { rejectUnauthorized: false } });
              let contacts = book.phonebooks.phonebook.contact;

              if (contacts) {
                for (const contact of contacts) {
                  let numbers = contact.telephony ? contact.telephony.number : false;

                  if (numbers) {
                    if (numbers.length) {
                      let telNumbers = [];

                      for (const number of numbers) {
                        let telnr = number._;

                        // eslint-disable-next-line no-useless-escape
                        telnr = telnr.replace(/\s/g, '').replace(/\-/g, '').replace(/\–/g, '');
                        telNumbers.push(telnr);

                        if (telnr.startsWith(lkz1) || telnr.startsWith(lkz2)) {
                          // +49
                          if (telnr.startsWith(lkz1)) {
                            telNumbers.push(telnr.replace(lkz1, '0')); // 0
                            telNumbers.push(telnr.replace(lkz1, '00' + lkz)); // 0049

                            if (telnr.includes(okz)) {
                              telNumbers.push('0' + telnr.split(lkz1)[1]);
                              telNumbers.push(telnr.split(okz)[1]);
                            } /*else {
                              telNumbers.push(telnr.split(lkz1)[0] + okz + telnr.split(lkz1)[1]);
                            }*/
                          }

                          // 0049
                          if (telnr.startsWith(lkz2)) {
                            telNumbers.push(telnr.replace(lkz2, '0')); // 0
                            telNumbers.push(telnr.replace(lkz2, '+' + lkz)); // +49

                            if (telnr.includes(okz)) {
                              telNumbers.push('0' + telnr.split(lkz2)[1]);
                              telNumbers.push(telnr.split(okz)[1]);
                            } /*else {
                              telNumbers.push(telnr.split(lkz2)[0] + okz + telnr.split(lkz2)[1]);
                            }*/
                          }
                        } else {
                          // +1
                          if (telnr.startsWith('+')) {
                            telNumbers.push(telnr.replace('+', '00')); //  001
                          }

                          // 001
                          if (telnr.startsWith('00')) {
                            telNumbers.push(telnr.replace('00', '+')); //+1
                          }

                          if (telnr.startsWith(okz1)) {
                            telNumbers.push(telnr.replace(okz1, ''));
                          }

                          /*if(!telnr.startsWith('+') && 
                           !telnr.startsWith('00') && 
                           !telnr.startsWith(okz1)){
                            telNumbers.push(okz1 + telnr);
                          }*/
                        }
                      }

                      telBook.push({ name: contact.person.realName, number: telNumbers });

                      if (blacklists.includes(bookName)) {
                        blackBook.push({ name: contact.person.realName, number: telNumbers });
                      }
                    } else {
                      let telNumbers = [];
                      let telnr = numbers._;

                      // eslint-disable-next-line no-useless-escape
                      telnr = telnr.replace(/\s/g, '').replace(/\-/g, '').replace(/\–/g, '');
                      telNumbers.push(telnr);

                      if (telnr.startsWith(lkz1) || telnr.startsWith(lkz2)) {
                        // +49
                        if (telnr.startsWith(lkz1)) {
                          telNumbers.push(telnr.replace(lkz1, '0')); // 0
                          telNumbers.push(telnr.replace(lkz1, '00' + lkz)); // 0049

                          if (telnr.includes(okz)) {
                            telNumbers.push('0' + telnr.split(lkz1)[1]);
                            telNumbers.push(telnr.split(okz)[1]);
                          } /*else {
                            telNumbers.push(telnr.split(lkz1)[0] + okz + telnr.split(lkz1)[1]);
                          }*/
                        }

                        // 0049
                        if (telnr.startsWith(lkz2)) {
                          telNumbers.push(telnr.replace(lkz2, '0')); // 0
                          telNumbers.push(telnr.replace(lkz2, '+' + lkz)); // +49

                          if (telnr.includes(okz)) {
                            telNumbers.push('0' + telnr.split(lkz2)[1]);
                            telNumbers.push(telnr.split(okz)[1]);
                          } /*else {
                            telNumbers.push(telnr.split(lkz2)[0] + okz + telnr.split(lkz2)[1]);
                          }*/
                        }
                      } else {
                        // +1
                        if (telnr.startsWith('+')) {
                          telNumbers.push(telnr.replace('+', '00')); // 001
                        }

                        // 001
                        if (telnr.startsWith('00')) {
                          telNumbers.push(telnr.replace('00', '+')); //  +1
                        }

                        if (telnr.startsWith(okz1)) {
                          telNumbers.push(telnr.replace(okz1, ''));
                        }

                        /*if(!telnr.startsWith('+') && 
                           !telnr.startsWith('00') && 
                           !telnr.startsWith(okz1)){
                            telNumbers.push(okz1 + telnr);
                        }*/
                      }

                      telBook.push({ name: contact.person.realName, number: telNumbers });

                      if (blacklists.includes(bookName)) {
                        blackBook.push({ name: contact.person.realName, number: telNumbers });
                      }
                    }
                  }
                }
              } else {
                logger.debug(
                  `Phonebook [${id}] does not contain any contacts. Skipping..`,
                  `${accessory.displayName} (${subtype})`
                );
              }
              logger.debug(`Phone book [${id}] done.`, `${accessory.displayName} (${subtype})`);
            }

            logger.info(
              `Storing phonebook results to ${this.configPath}/fritzbox/phonebook.json`,
              `${accessory.displayName} (${subtype})`
            );

            await fs.ensureFile(`${this.configPath}/fritzbox/phonebook.json`);
            await fs.writeJson(`${this.configPath}/fritzbox/phonebook.json`, telBook, { spaces: 2 });

            if (blackBook.length) {
              logger.info(
                `Storing blackbook results to ${this.configPath}/fritzbox/blackbook.json`,
                `${accessory.displayName} (${subtype})`
              );
              await fs.ensureFile(`${this.configPath}/fritzbox/blackbook.json`);
              await fs.writeJson(`${this.configPath}/fritzbox/blackbook.json`, blackBook, { spaces: 2 });
            }

            logger.info('Done!', `${accessory.displayName} (${subtype})`);
          } catch (err) {
            logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
            logger.error(err);
          } finally {
            setTimeout(
              () =>
                accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(false),
              1000
            );
          }
        }
        break;
      }
      case 'ringlock': {
        try {
          let phonesFormData = [];
          let now = moment();
          let hour = now.hour();
          let minute = now.minute();
          let endhour = now.add(12, 'h');
          let endminute = '00';

          /*
          let dayForm;
          let today = new Date();
          if(today.getDay() === 6 || today.getDay() === 0){
            dayForm = 'weekend';
          } else {
            dayForm = 'weekday';
          }
          */

          if (accessory.context.config.extras[subtype].start && accessory.context.config.extras[subtype].end) {
            let s = accessory.context.config.extras[subtype].start.split(':');
            let e = accessory.context.config.extras[subtype].end.split(':');

            hour = s[0];
            minute = s[1];
            endhour = e[0];
            endminute = e[1];
          } else {
            if (hour < 10 && hour >= 0) {
              hour = '0' + hour;
            }

            if (minute < 10 && minute >= 0) {
              minute = '0' + minute;
            }

            if (endhour < 10 && endhour >= 0) {
              endhour = '0' + endhour;
            }
          }

          let data = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          let sid = data['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          for (let count = 1; count <= accessory.context.config.extras[subtype].DECTphones; count++) {
            if (state) {
              logger.info('ON', `${accessory.displayName} (${subtype})`);

              phonesFormData.push({
                idx: count.toString(),
                xhr: '1',
                nightsetting: '1',
                lockmode: '0',
                lockday: 'everyday',
                starthh: hour.toString(),
                startmm: minute.toString(),
                endhh: endhour.toString(),
                endmm: endminute.toString(),
                event: 'on',
                popup_url: '',
                apply: '',
                sid: sid,
                page: 'edit_dect_ring_block',
              });
            } else {
              logger.info('OFF', `${accessory.displayName} (${subtype})`);

              phonesFormData.push({
                idx: count.toString(),
                xhr: '1',
                popup_url: '',
                apply: '',
                sid: sid,
                page: 'edit_dect_ring_block',
              });
            }
          }

          for (const formData of phonesFormData) {
            logger.debug(`SET CMD: ${JSON.stringify(formData)}`, `${accessory.displayName} (${subtype})`);
            await requestLUA(formData, fritzbox.url.hostname, '/data.lua', 'nightsetting', true);
          }
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(
            () =>
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state),
            1000
          );
        }
        break;
      }
      case 'wakeup': {
        try {
          if (state) {
            logger.info('ON', `${accessory.displayName} (${subtype})`);

            await fritzbox.exec('urn:X_VoIP-com:serviceId:X_VoIP1', 'X_AVM-DE_DialNumber', {
              'NewX_AVM-DE_PhoneNumber': accessory.context.config.extras[subtype].internNr,
            });
          } else {
            logger.info('OFF', `${accessory.displayName} (${subtype})`);

            await fritzbox.exec('urn:X_VoIP-com:serviceId:X_VoIP1', 'X_AVM-DE_DialHangup');
          }
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(
            () =>
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state),
            1000
          );
        }
        break;
      }
      case 'dnsServer': {
        logger.info(`${state ? 'ON' : 'OFF'} (${subtype})`, `${accessory.displayName} (${subtype})`);

        try {
          const response = await fritzbox.exec('urn:DeviceConfig-com:serviceId:DeviceConfig1', 'X_AVM-DE_CreateUrlSID');
          const sid = response['NewX_AVM-DE_UrlSID'].split('sid=')[1];

          const preferredDns = accessory.context.config.extras[subtype].preferredDns.split('.');
          const alternateDns = accessory.context.config.extras[subtype].alternateDns.split('.');

          let formData = {
            xhr: '1',
            ipv4_use_user_dns: '0',
            dot_enabled: '0',
            dot_strict: '1',
            dot_udp_fallback: '1',
            dot_fqdn_list: '',
            apply: '',
            sid: sid,
            page: 'dnsSrv',
          };

          if (state) {
            formData = {
              ...formData,
              ipv4_use_user_dns: '1',
              ipv4_user_firstdns0: preferredDns[0],
              ipv4_user_firstdns1: preferredDns[1],
              ipv4_user_firstdns2: preferredDns[2],
              ipv4_user_firstdns3: preferredDns[3],
              ipv4_user_seconddns0: alternateDns[0],
              ipv4_user_seconddns1: alternateDns[1],
              ipv4_user_seconddns2: alternateDns[2],
              ipv4_user_seconddns3: alternateDns[3],
            };
          }

          logger.debug(`SET CMD: ${JSON.stringify(formData)}`, `${accessory.displayName} (${subtype})`);
          await requestLUA(formData, fritzbox.url.hostname, '/data.lua');
        } catch (err) {
          logger.warn('An error occured during setting state!', `${accessory.displayName} (${subtype})`);
          logger.error(err);

          setTimeout(
            () =>
              accessory.getService(this.api.hap.Service.Switch).getCharacteristic(characteristic).updateValue(!state),
            1000
          );
        }
        break;
      }
      default:
        logger.warn(
          `Can not handle SET event. Unknown accessory subtype (${subtype})`,
          `${accessory.displayName} (${subtype})`
        );
        break;
    }

    accessory.context.busy = false;
  }

  async poll() {
    const RouterHandler = require('../router/router.handler');

    const validOptionsSwitches = [
      'wifi_2ghz',
      'wifi_5ghz',
      'wifi_guest',
      'wps',
      'led',
      'lock',
      'dect',
      'aw',
      'deflection',
      'reconnect',
    ];

    try {
      const accessories = this.accessories.filter((accessory) => accessory.context.config.type === 'extra');

      for (const accessory of accessories) {
        if (!this.polling.exclude.includes(accessory.context.config.subtype)) {
          if (validOptionsSwitches.includes(accessory.context.config.subtype)) {
            await RouterHandler.get(accessory);
          } else {
            await this.get(accessory);
          }
        }
      }
    } catch (err) {
      logger.warn('An error occurred during polling extras!');
      logger.error(err);
    } finally {
      setTimeout(() => this.poll(), this.polling.timer * 1000);
    }
  }
}

const handler = new Handler();
module.exports = handler;
