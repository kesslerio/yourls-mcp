"""
YOURLS API Client
"""
import requests
import time
import hashlib
from typing import Dict, Any, Optional, Union


class YourlsClient:
    """Client for interacting with YOURLS API"""
    
    def __init__(self, api_url: str, 
                 auth_method: str = "password",
                 username: Optional[str] = None, 
                 password: Optional[str] = None,
                 signature_token: Optional[str] = None,
                 signature_ttl: int = 43200):
        """
        Initialize YOURLS API client
        
        Args:
            api_url: URL to your YOURLS API endpoint (e.g., https://example.com/yourls-api.php)
            auth_method: Authentication method to use ("password" or "signature")
            username: YOURLS username (required for password authentication)
            password: YOURLS password (required for password authentication)
            signature_token: YOURLS signature token (required for signature authentication)
            signature_ttl: Time-to-live for signature in seconds (default: 43200 = 12 hours)
        """
        self.api_url = api_url
        self.auth_method = auth_method
        self.signature_token = signature_token
        self.signature_ttl = signature_ttl
        
        if auth_method == "password":
            if not username or not password:
                raise ValueError("Username and password are required for password authentication")
            self.auth = {
                'username': username,
                'password': password,
            }
        elif auth_method == "signature":
            if not signature_token:
                raise ValueError("Signature token is required for signature authentication")
            self.auth = {}
        else:
            raise ValueError("Invalid authentication method. Use 'password' or 'signature'")
    
    def _get_signature_auth(self) -> Dict[str, str]:
        """
        Generate time-based signature authentication parameters
        
        Returns:
            Dictionary with signature authentication parameters
        """
        if self.auth_method != "signature":
            return {}
            
        timestamp = str(int(time.time()))
        signature = hashlib.md5((timestamp + self.signature_token).encode()).hexdigest()
        
        return {
            'timestamp': timestamp,
            'signature': signature
        }
    
    def _request(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a request to the YOURLS API
        
        Args:
            action: API action to perform
            params: Additional parameters for the request
            
        Returns:
            API response as dictionary
        """
        request_params = {
            'action': action,
            'format': 'json',
            **params
        }
        
        # Add authentication parameters based on method
        if self.auth_method == "password":
            request_params.update(self.auth)
        elif self.auth_method == "signature":
            request_params.update(self._get_signature_auth())
        
        response = requests.post(self.api_url, data=request_params)
        response.raise_for_status()
        
        return response.json()
    
    def shorten(self, url: str, keyword: Optional[str] = None, title: Optional[str] = None) -> Dict[str, Any]:
        """
        Shorten a URL
        
        Args:
            url: URL to shorten
            keyword: Optional custom keyword for the short URL
            title: Optional title for the URL
            
        Returns:
            API response with shorturl and other details
        """
        params = {'url': url}
        
        if keyword:
            params['keyword'] = keyword
            
        if title:
            params['title'] = title
            
        return self._request('shorturl', params)
    
    def expand(self, shorturl: str) -> Dict[str, Any]:
        """
        Expand a short URL to its original long URL
        
        Args:
            shorturl: Short URL or keyword to expand
            
        Returns:
            API response with longurl and other details
        """
        return self._request('expand', {'shorturl': shorturl})
    
    def url_stats(self, shorturl: str) -> Dict[str, Any]:
        """
        Get statistics for a shortened URL
        
        Args:
            shorturl: Short URL or keyword to get stats for
            
        Returns:
            API response with click count and other stats
        """
        return self._request('url-stats', {'shorturl': shorturl})
    
    def db_stats(self) -> Dict[str, Any]:
        """
        Get global statistics for the YOURLS instance
        
        Returns:
            API response with total links and clicks
        """
        return self._request('db-stats', {})