'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

module.exports = class TPLinkKasaDriver extends OAuth2Driver {

  async onPairListDevices({ oAuth2Client }) {
    const { devices } = await oAuth2Client.getDevices();

    return devices
      .filter(device => {
        return this.onPairFilterDevice(device);
      })
      .map(device => ({
        name: device.name,
        data: {
          id: device.id,
        },
        ...this.onPairListDevice(device),
      }));
  }

  onPairFilterDevice(device) {
    return device.model.includes(this.manifest.id);
  }

  onPairListDevice(device) {
    return {};
  }

}
