'use strict';

const exec = require('child_process').exec;
const fs = require('fs-extra');

exports.initReboot = async (file) => {
  let exists = await fs.pathExists(file);

  return new Promise((resolve, reject) => {
    if (exists) {
      file = 'sh ' + file;

      exec(file, (error, stdout, stderr) => {
        if (error && error.code > 0) return reject(error);

        resolve(stdout ? stdout : stderr);
      });
    } else {
      reject('File not exists!');
    }
  });
};
