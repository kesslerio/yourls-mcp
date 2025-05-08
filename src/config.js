/**
 * YOURLS-MCP Configuration module
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

/**
 * Loads configuration from YAML file and environment variables
 * 
 * @param {string} configPath - Path to config file (optional)
 * @returns {object} Configuration object
 */
function loadConfig(configPath) {
  let config = {
    yourls: {
      api_url: process.env.YOURLS_API_URL,
      auth_method: process.env.YOURLS_AUTH_METHOD || 'signature',
      username: process.env.YOURLS_USERNAME,
      password: process.env.YOURLS_PASSWORD,
      signature_token: process.env.YOURLS_SIGNATURE_TOKEN,
      signature_ttl: process.env.YOURLS_SIGNATURE_TTL || 43200
    }
  };

  // If environment variables are set, use them
  if (config.yourls.api_url && 
      ((config.yourls.auth_method === 'signature' && config.yourls.signature_token) || 
       (config.yourls.auth_method === 'password' && config.yourls.username && config.yourls.password))) {
    return config;
  }

  // Otherwise, try to load from file
  try {
    const resolvedPath = configPath || path.join(process.cwd(), 'config.yaml');
    
    if (fs.existsSync(resolvedPath)) {
      const fileContents = fs.readFileSync(resolvedPath, 'utf8');
      const fileConfig = yaml.load(fileContents);
      
      // Merge with existing config, prioritizing environment variables
      config = {
        yourls: {
          ...fileConfig.yourls,
          ...config.yourls
        }
      };
    }
  } catch (error) {
    console.error(`Error loading configuration file: ${error.message}`);
  }

  return config;
}

/**
 * Validates the configuration
 * 
 * @param {object} config - Configuration object
 * @throws {Error} If configuration is invalid
 */
function validateConfig(config) {
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

module.exports = {
  loadConfig,
  validateConfig
};