/**
 * Script to create a short URL for Google using the new Force Allow Duplicates plugin
 */
import YourlsClient from '../../src/api.js';
import axios from 'axios';

// Configuration
const config = {
  api_url: 'https://bysha.pe/yourls-api.php',
  auth_method: 'signature',
  signature_token: '44845b557c',
  signature_ttl: 43200 // 12 hours
};

// Set debug mode
process.env.YOURLS_DEBUG = 'true';

// Create an instance of the YOURLS client
const client = new YourlsClient(config);

// Main function
async function createGoogleShortUrl() {
  try {
    // The URL we want to shorten
    const url = 'https://www.google.com';
    
    // The keyword we want to use
    const keyword = 'GOOG';
    
    console.log(`Creating short URL for ${url} with keyword ${keyword}...`);
    
    // Make a direct API call with force=1 parameter to use our new plugin
    const params = new URLSearchParams();
    params.append('action', 'shorturl');
    params.append('url', url);
    params.append('keyword', keyword);
    params.append('force', '1');  // Use our Force Allow Duplicates plugin
    params.append('format', 'json');
    
    // Add authentication
    const auth = client._getSignatureAuth();
    params.append('timestamp', auth.timestamp);
    params.append('signature', auth.signature);
    
    // Make the API call
    const response = await axios.post(config.api_url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const result = response.data;
    
    console.log('API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.status === 'success') {
      if (result.shorturl && result.shorturl.includes(keyword)) {
        console.log('✅ Success! Created short URL for Google with custom keyword.');
        console.log(`Short URL: ${result.shorturl}`);
        console.log('This was created using the Force Allow Duplicates plugin.');
      } else {
        console.log('⚠️ API returned success but with a different URL.');
        console.log(`Returned URL: ${result.shorturl}`);
        console.log('The Force Allow Duplicates plugin may not be working correctly.');
        
        // Fall back to URL modification approach
        console.log('\nTrying URL modification approach...');
        
        // Add a timestamp to make the URL unique
        const timestamp = Date.now();
        const modifiedUrl = `${url}?_t=${timestamp}`;
        
        // Create with the modified URL
        const modifiedResult = await client.shorten(modifiedUrl, keyword);
        
        console.log('URL Modification Result:');
        console.log(JSON.stringify(modifiedResult, null, 2));
        
        if (modifiedResult.status === 'success') {
          console.log(`✅ Success! Created short URL using URL modification.`);
          console.log(`Short URL: ${modifiedResult.shorturl}`);
          console.log(`Note: In YOURLS database, this points to: ${modifiedUrl}`);
          console.log('But for users, it will effectively be a shortlink to: https://www.google.com');
        } else {
          console.log(`❌ Failed with URL modification: ${modifiedResult.message || 'Unknown error'}`);
        }
      }
    } else {
      console.log(`❌ API returned error: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating short URL:');
    console.error(error.message);
    if (error.response && error.response.data) {
      console.error('API Response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the function
createGoogleShortUrl();