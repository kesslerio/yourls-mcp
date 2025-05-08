"""
YOURLS API Client
"""
import requests
from typing import Dict, Any, Optional


class YourlsClient:
    """Client for interacting with YOURLS API"""
    
    def __init__(self, api_url: str, username: str, password: str):
        """
        Initialize YOURLS API client
        
        Args:
            api_url: URL to your YOURLS API endpoint (e.g., https://example.com/yourls-api.php)
            username: YOURLS username
            password: YOURLS password
        """
        self.api_url = api_url
        self.auth = {
            'username': username,
            'password': password,
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
            **self.auth,
            **params
        }
        
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