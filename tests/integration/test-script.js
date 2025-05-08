const YourlsClient = require('./src/api.js').default;

const client = new YourlsClient({
  api_url: 'https://bysha.pe/yourls-api.php',
  auth_method: 'signature',
  signature_token: '44845b557c',
  signature_ttl: 43200
});

// Set debug mode
process.env.YOURLS_DEBUG = 'true';

async function test() {
  try {
    const result = await client.createCustomUrl('https://www.google.com', 'GOOG');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response && error.response.data) {
      console.error('API Response:', JSON.stringify(error.response.data));
    }
    throw error;
  }
}

test();