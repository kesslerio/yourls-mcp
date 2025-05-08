/**
 * YOURLS-MCP Configuration module
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

/**
 * Loads configuration from environment variables
 * 
 * @returns {object} Configuration object
 */
export function loadConfig() {
  const config = {
    yourls: {
      api_url: process.env.YOURLS_API_URL,
      auth_method: process.env.YOURLS_AUTH_METHOD || 'signature',
      username: process.env.YOURLS_USERNAME,
      password: process.env.YOURLS_PASSWORD,
      signature_token: process.env.YOURLS_SIGNATURE_TOKEN,
      signature_ttl: process.env.YOURLS_SIGNATURE_TTL || 43200
    }
  };

  return config;
}

/**
 * Validates the configuration
 * 
 * @param {object} config - Configuration object
 * @throws {Error} If configuration is invalid
 */
export function validateConfig(config) {
  if (!config.yourls || !config.yourls.api_url) {
    throw new Error('Invalid configuration: missing YOURLS API URL');
  }

  const authMethod = config.yourls.auth_method || 'signature';

  if (authMethod === 'password' && (!config.yourls.username || !config.yourls.password)) {
    throw new Error('Invalid configuration: missing username or password for password authentication');
  }

  if (authMethod === 'signature' && !config.yourls.signature_token) {
    throw new Error('Invalid configuration: missing signature token for signature authentication');
  }
}