'use strict';

exports.colortemp2api = (param) => {
  if (param > 6200) return 6500;
  else if (param > 5600) return 5900;
  else if (param > 5000) return 5300;
  else if (param > 4500) return 4700;
  else if (param > 4000) return 4200;
  else if (param > 3600) return 3800;
  else if (param > 3200) return 3400;
  else if (param > 2850) return 3000;
  else return 2700;
};

exports.getValidColor = (hue, sat) => {
  hue = Math.round(hue);
  sat = Math.round(sat);

  let hues = [35, 52, 92, 120, 160, 195, 212, 225, 266, 296, 335, 358];
  let sats = [
    [72, 140, 214],
    [51, 102, 153],
    [38, 79, 123],
    [38, 82, 160],
    [41, 84, 145],
    [59, 118, 179],
    [56, 110, 169],
    [67, 135, 204],
    [54, 110, 169],
    [46, 92, 140],
    [51, 107, 180],
    [54, 112, 180],
  ];

  let validHue = hues.reduce((prev, curr) => (Math.abs(curr - hue) < Math.abs(prev - hue) ? curr : prev));
  let indexHue = hues.indexOf(validHue);
  let satsByIndex = sats[indexHue];
  let validSaturation = satsByIndex.reduce((prev, curr) => (Math.abs(curr - sat) < Math.abs(prev - sat) ? curr : prev));

  return { hue: validHue, sat: validSaturation };
};
