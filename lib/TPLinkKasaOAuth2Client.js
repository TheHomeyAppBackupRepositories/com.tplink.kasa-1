'use strict';

const Homey = require('homey');
const { OAuth2Client } = require('homey-oauth2app');

module.exports = class TPLinkKasaOAuth2Client extends OAuth2Client {

  async onRequestHeaders({ headers }) {
    return {
      ...await super.onRequestHeaders({ headers }),
      'X-Api-Key': Homey.env.API_KEY,
      'X-Client-Id': this._clientId,
    };
  }

  /**
   * The error message is added as the body.msg, therefore the override of the NotOK
   *
   * @param body
   * @param status
   * @param statusText
   * @returns {Promise<Error>}
   */
  async onHandleNotOK({
                        body,
                        status,
                        statusText,
                      }) {
    const message = (body && body.msg) ? body.msg : 'Unknown Error';
    const err = new Error(message);
    err.status = status;
    err.statusText = message;
    return err;
  }

  async getDevices() {
    return this.get({
      path: '/devices',
    }).then(({ data }) => data);
  }

  async getDevice({ deviceId }) {
    return this.get({
        path: `/devices/${deviceId}`,
      }).then(({ data }) => data);
  }

  /**
   * Returns the current energy consumption of the device
   */
  async getRealTimeEnergyConsumption({ deviceId }) {
    return this.get({
      path: `/devices/${deviceId}/realtime-energy-consumption`,
    }).then(({ data }) => data);
  }

  /**
   * On/Off capability
   */
  async setDevicePower({ deviceId, powered = true, transitionPeriod = 0 }) {
    return this.post({
      path: `/devices/${deviceId}/power`,
      json: {
        data: {
          powered,
          transitionPeriod,
        },
      },
    }).then(({ data }) => data);
  }

  /**
   * light capabilities
   */
  async setDeviceBrightness({ deviceId, brightness = 1, transitionPeriod = 100 }) {
    return this.post({
      path: `/devices/${deviceId}/brightness`,
      json: {
        data: {
          brightness,
          transitionPeriod,
        },
      },
    }).then(({ data }) => data);
  }

  setDeviceColor({ deviceId, hue, saturation, brightness, transitionPeriod = 250 }) {
    return this.post({
      path: `/devices/${deviceId}/color`,
      json: {
        data: {
          color: {
            hsb: {
              hue,
              saturation,
              brightness,
            },
          },
          transitionPeriod,
        },
      },
    }).then(({ data }) => data);
  }

  setDeviceTemperature({ deviceId, colorTemperature, transitionPeriod = 250 }) {
    return this.post({
      path: `/devices/${deviceId}/color-temperature`,
      json: {
        data: {
          colorTemperature,
          transitionPeriod,
        },
      },
    }).then(({ data }) => data);
  }
};
