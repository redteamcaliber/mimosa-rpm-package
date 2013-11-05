var nconf = require('nconf');

// The settings definitions.
var settings_json = '../../conf/settings.json';
var settings = require(settings_json);

var env_json = '../../conf/env.json';
var env_settings = require(env_json);

// Load the settings.
nconf.overrides(env_settings);
nconf.defaults(settings);

// Export the settings to the env.
exports.get = function (key) {
    return nconf.get(key);
};
exports.set = function (key, value) {
    return nconf.set(key, value);
};

exports.SERVER_PORT = 'server:port';
exports.SERVER_KEY = 'server:key';
exports.SERVER_CERT = 'server:cert';

exports.UAC_DB_NAME = 'uac:db_name';

exports.UAC_SS_API_URL = 'uac:ss_api_url';
exports.UAC_SF_API_URL = 'uac:sf_api_url';

// SSO Settings.
exports.SSO_AUTH_USER = 'sso:auth_user';
exports.SSO_AUTH_PASS = 'sso:auth_pass';
exports.SSO_AUTH_URL = 'sso:auth_url';
exports.SSO_AUTH_COOKIE = 'sso:auth_cookie';
exports.SSO_LOGIN_URL = 'sso:login_url';
exports.SSO_UNAUTH_URL = 'sso:unauth_url';
exports.SSO_REFRESH_URL = 'sso:refresh_url';
exports.SSO_LOGOUT_URL = 'sso:logout_url';
exports.SSO_PUBKEY = 'sso:pubkey';

