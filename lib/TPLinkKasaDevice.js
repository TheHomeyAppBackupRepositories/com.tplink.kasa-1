'use strict';

const { OAuth2Device } = require('homey-oauth2app');

module.exports = class TPLinkKasaDevice extends OAuth2Device {
  static POLL_INTERVAL = 1000 * 60 * 10;  // 10 min because of rate limiting

  async onOAuth2Init() {
    this.getDeviceInfo();

    if (this.onPollInterval) {
      this.homey.clearInterval(this.onPollInterval);
    }

    this.getDeviceInfoBind = this.getDeviceInfo.bind(this);
    this.onPollInterval = this.homey.setInterval(this.getDeviceInfoBind, this.constructor.POLL_INTERVAL);
  }

  async onOAuth2Uninit() {
    if (this.onPollInterval) {
      this.homey.clearInterval(this.onPollInterval);
    }
  }

  getDeviceInfo() {
    const deviceId = this.getData().id;

    this.oAuth2Client.getDevice({ deviceId })
      .then(async ({ device, state }) => {
        await this.setDeviceCapabilities({ device, state });

        if(Array.isArray(device.capability) &&
          device.capability.includes('traits.devices.EnergyMonitoring') &&
          !this.hasCapability('measure_power')) {
            await this.addCapability('measure_power');
        }

        if (this.hasCapability('measure_power')) {
          this.getDeviceEnergyInfo();
        }

        await this.setAvailable();
      })
      .catch(err => {
        this.error(err);
        this.setUnavailable(err).catch(this.error);
      });
  }

  async setDeviceCapabilities({ device, state }) {
    if (device.metadata) {
      this.metadata = device.metadata;
    }

    if (this.hasCapability('onoff')) {
      if (typeof state.powered === 'boolean') {
        await this.setCapabilityValue('onoff', state.powered).catch(this.error);
      }
    }
  }

  /**
   * Returns the realtime energy info if supported
   *
   */
  getDeviceEnergyInfo() {
    const deviceId = this.getData().id;

    this.oAuth2Client.getRealTimeEnergyConsumption({ deviceId })
      .then(data => {
        if (data.realTimeStat && typeof data.realTimeStat.powerWatts === 'number') {
          return this.setCapabilityValue('measure_power', data.realTimeStat.powerWatts);
        }
      })
      .catch(err => {
        this.error(err);
      });
  }
};
