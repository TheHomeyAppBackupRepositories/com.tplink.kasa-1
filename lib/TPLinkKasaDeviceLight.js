'use strict';

const TPLinkKasaDevice = require('./TPLinkKasaDevice');

module.exports = class TPLinkKasaDeviceLight extends TPLinkKasaDevice {

  async onOAuth2Init() {
    await super.onOAuth2Init();

    if (this.hasCapability('onoff')) {
      this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    }

    if (this.hasCapability('dim')) {
      this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    }

    if (this.hasCapability('light_mode')) {
      this.registerCapabilityListener('light_mode', this.onCapabilityMode.bind(this));
    }

    if (this.hasCapability('light_hue') && this.hasCapability('light_saturation')) {
      this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityColor.bind(this), 500);
    }

    if (this.hasCapability('light_temperature')) {
      this.registerCapabilityListener('light_temperature', this.onCapabilityTemperature.bind(this));
    }
  }

  async onCapabilityOnoff(value) {
    const deviceId = this.getData().id;
    await this.oAuth2Client.setDevicePower({
      deviceId,
      powered: !!value,
      transitionPeriod: this.getTransitionPeriod(),
    });
  }

  async onCapabilityDim(value) {
    const deviceId = this.getData().id;

    await this.oAuth2Client.setDeviceBrightness({
      deviceId,
      brightness: value * 100,
      transitionPeriod: this.getTransitionPeriod(),
    });
  }

  async onCapabilityMode(mode) {
    if (mode === 'color') {
      await this.onCapabilityColor({
        light_hue: this.getCapabilityValue('light_hue'),
        light_saturation: this.getCapabilityValue('light_saturation'),
      });
    }

    if (mode === 'temperature') {
      await this.onCapabilityTemperature(this.getCapabilityValue('light_temperature'));
    }
  }

  /**
   * The TP-Link api accepts color af HSB value
   *
   * @param light_hue
   * @param light_saturation
   * @returns {Promise<void>}
   */
  async onCapabilityColor({ light_hue, light_saturation }) {
    const deviceId = this.getData().id;

    if(light_hue === null || light_hue === undefined) {
      light_hue = this.getCapabilityValue('light_hue');
    }
    if(light_saturation === null || light_saturation === undefined) {
      light_saturation = this.getCapabilityValue('light_saturation');
    }

    await this.oAuth2Client.setDeviceColor({
      deviceId,
      hue: Math.round(light_hue * 360),
      saturation: light_saturation * 100,
      brightness: this.getCapabilityValue('dim') * 100,
      transitionPeriod: this.getTransitionPeriod(),
    });
  }

  /**
   * Sets the color temperature of the light based on the metadata for the color temperature
   *
   * @param value
   * @returns {Promise<void>}
   */
  async onCapabilityTemperature(value) {
    const minColorTemperature = (this.metadata && this.metadata.minColorTemperature) ? this.metadata.minColorTemperature : this.constructor.minColorTemperature;
    const maxColorTemperature = (this.metadata && this.metadata.maxColorTemperature) ? this.metadata.maxColorTemperature : this.constructor.maxColorTemperature;

    const tempRange = maxColorTemperature - minColorTemperature;
    const colorTemperature = Math.round((1 - value) * tempRange) + minColorTemperature;

    const deviceId = this.getData().id;
    await this.oAuth2Client.setDeviceTemperature({
      deviceId,
      colorTemperature,
      transitionPeriod: this.getTransitionPeriod(),
    });
  }

  async setDeviceCapabilities({ device, state }) {
    await super.setDeviceCapabilities({ device, state });

    if (this.hasCapability('dim')) {
      if (typeof state.brightness === 'number') {
        this.setCapabilityValue('dim', state.brightness / 100).catch(this.error);
      }
    }

    let lightMode = null;

    // The only way to check if the light is in color mode is to check if the hue and saturation are not zero
    if (this.hasCapability('light_hue') && this.hasCapability('light_saturation')) {
      if (state.color && state.color.hsb &&
        typeof state.color.hsb.hue === 'number' &&
        typeof state.color.hsb.saturation === 'number' &&
        state.color.hsb.hue !== 0 &&
        state.color.hsb.saturation !== 0
      ) {
        this.setCapabilityValue('light_hue', state.color.hsb.hue / 360).catch(this.error);
        this.setCapabilityValue('light_hue', state.color.hsb.saturation / 100).catch(this.error);

        lightMode = 'color';
      }
    }

    // The only way to check if the light is in temperature mode is to check if the colorTemperature is not zero
    if (this.hasCapability('light_hue') && this.hasCapability('light_saturation')) {
      if (typeof state.colorTemperature === 'number' && state.colorTemperature !== 0) {
        const minColorTemperature = (this.metadata && this.metadata.minColorTemperature) ? this.metadata.minColorTemperature : this.constructor.minColorTemperature;
        const maxColorTemperature = (this.metadata && this.metadata.maxColorTemperature) ? this.metadata.maxColorTemperature : this.constructor.maxColorTemperature;

        const tempRange = maxColorTemperature - minColorTemperature;
        const lightTemperature = 1 - ((state.colorTemperature - minColorTemperature) / tempRange);

        this.setCapabilityValue('light_temperature', lightTemperature).catch(this.error);

        lightMode = 'temperature';
      }
    }

    if (this.hasCapability('light_mode') && lightMode !== null) {
      this.setCapabilityValue('light_mode', lightMode).catch(this.error);
    }
  }

  /**
   * Returns the transition period setting if set
   *
   * @returns {any|number}
   */
  getTransitionPeriod() {
    const transitionPeriod = this.getSetting('transitionPeriod');

    return (transitionPeriod) ? transitionPeriod : 0;
  }
};
