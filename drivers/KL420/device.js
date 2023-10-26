'use strict';

const TPLinkKasaDeviceLight = require("../../lib/TPLinkKasaDeviceLight");

module.exports = class extends TPLinkKasaDeviceLight {
  static minColorTemperature = 2500;
  static maxColorTemperature= 9000;
}
