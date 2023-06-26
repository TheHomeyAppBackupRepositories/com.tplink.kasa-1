'use strict';

const TPLinkKasaDevice = require('./TPLinkKasaDevice');

module.exports = class TPLinkKasaDeviceSocket extends TPLinkKasaDevice {

  async onOAuth2Init() {
    await super.onOAuth2Init();

    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    }
  }

  async onCapabilityOnoff(value) {
    const deviceId = this.getData().id;
    await this.oAuth2Client.setDevicePower({
      deviceId,
      powered: !!value,
    });
  }
}