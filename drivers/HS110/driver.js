'use strict';

const TPLinkKasaDriver = require("../../lib/TPLinkKasaDriver");

module.exports = class extends TPLinkKasaDriver {
  onPairFilterDevice(device) {
    return device.model.includes('HS110');
  }
}
