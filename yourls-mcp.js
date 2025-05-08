#!/usr/bin/env node

const { McpServer } = require('@modelcontextprotocol/sdk');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load configuration
let config;
try {
  const configPath = process.argv.includes('--config') 
    ? process.argv[process.argv.indexOf('--config') + 1]
    : path.join(__dirname, 'config.yaml');
  
  const fileContents = fs.readFileSync(configPath, 'utf8');
  config = yaml.load(fileContents);
} catch (e) {
  console.error(`Error loading configuration: ${e.message}`);
  process.exit(1);
}

// Validate configuration
if (!config.yourls || !config.yourls.api_url) {
  console.error('Invalid configuration: missing YOURLS API URL');
  process.exit(1);
}

const yourlsConfig = config.yourls;
const authMethod = yourlsConfig.auth_method || 'signature';

if (authMethod === 'password' && (!yourlsConfig.username || !yourlsConfig.password)) {
  console.error('Invalid configuration: missing username or password for password authentication');
  process.exit(1);
}

if (authMethod === 'signature' && !yourlsConfig.signature_token) {
  console.error('Invalid configuration: missing signature token for signature authentication');
  process.exit(1);
}

// YOURLS API client functions
async function makeRequest(action, params = {}) {
  const requestParams = {
    action,
    format: 'json',
    ...params
  };
  
  // Add authentication
  if (authMethod === 'password') {
    requestParams.username = yourlsConfig.username;
    requestParams.password = yourlsConfig.password;
  } else if (authMethod === 'signature') {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = crypto
      .createHash('md5')
      .update(timestamp + yourlsConfig.signature_token)
      .digest('hex');
    
    requestParams.timestamp = timestamp;
    requestParams.signature = signature;
  }
  
  try {
    const response = await axios.post(yourlsConfig.api_url, requestParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    if (error.response) {
      console.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

// Create MCP server
const server = new McpServer({
  name: 'YOURLS URL Shortener',
  version: '0.1.0'
});

// Register tools
server.addTool({
  name: 'shorten_url',
  description: 'Shorten a long URL using YOURLS',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to shorten'
      },
      keyword: {
        type: 'string',
        description: 'Optional custom keyword for the short URL'
      },
      title: {
        type: 'string',
        description: 'Optional title for the URL'
      }
    },
    required: ['url']
  },
  execute: async ({ url, keyword, title }) => {
    try {
      const params = { url };
      if (keyword) params.keyword = keyword;
      if (title) params.title = title;
      
      const result = await makeRequest('shorturl', params);
      
      if (result.shorturl) {
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'success',
            shorturl: result.shorturl,
            url: result.url || url,
            title: result.title || title || ''
          })
        };
      } else {
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'error',
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          })
        };
      }
    } catch (error) {
      return {
        contentType: 'application/json',
        content: JSON.stringify({
          status: 'error',
          message: error.message
        })
      };
    }
  }
});

server.addTool({
  name: 'expand_url',
  description: 'Expand a short URL to its original long URL',
  inputSchema: {
    type: 'object',
    properties: {
      shorturl: {
        type: 'string',
        description: 'The short URL or keyword to expand'
      }
    },
    required: ['shorturl']
  },
  execute: async ({ shorturl }) => {
    try {
      const result = await makeRequest('expand', { shorturl });
      
      if (result.longurl) {
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'success',
            shorturl: result.shorturl || shorturl,
            longurl: result.longurl,
            title: result.title || ''
          })
        };
      } else {
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'error',
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          })
        };
      }
    } catch (error) {
      return {
        contentType: 'application/json',
        content: JSON.stringify({
          status: 'error',
          message: error.message
        })
      };
    }
  }
});

server.addTool({
  name: 'url_stats',
  description: 'Get statistics for a shortened URL',
  inputSchema: {
    type: 'object',
    properties: {
      shorturl: {
        type: 'string',
        description: 'The short URL or keyword to get stats for'
      }
    },
    required: ['shorturl']
  },
  execute: async ({ shorturl }) => {
    try {
      const result = await makeRequest('url-stats', { shorturl });
      
      if (result.link) {
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'success',
            shorturl: result.shorturl || shorturl,
            clicks: result.link.clicks || 0,
            title: result.link.title || '',
            longurl: result.link.url || ''
          })
        };
      } else {
        return {
          contentType: 'application/json',
          content: JSON.stringify({
            status: 'error',
            message: result.message || 'Unknown error',
            code: result.code || 'unknown'
          })
        };
      }
    } catch (error) {
      return {
        contentType: 'application/json',
        content: JSON.stringify({
          status: 'error',
          message: error.message
        })
      };
    }
  }
});

// Start the server
server.listen();
console.log('YOURLS-MCP server started');