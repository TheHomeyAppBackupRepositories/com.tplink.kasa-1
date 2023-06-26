'use strict';

const { OAuth2App } = require('homey-oauth2app');
const TPLinkKasaOAuth2Client = require('./TPLinkKasaOAuth2Client');

module.exports = class TPLinkKasaApp extends OAuth2App {

  async onOAuth2Init() {
    this.enableOAuth2Debug();
    this.setOAuth2Config({
      client: TPLinkKasaOAuth2Client,
      apiUrl: 'https://external-api.tplinkra.com/v1',
      tokenUrl: 'https://api.tplinkra.com/oauth/access_token',
      authorizationUrl: 'https://api.tplinkra.com/oauth/authorize',
      scopes: ['device_control'],
    });
  }

}