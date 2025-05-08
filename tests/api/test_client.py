"""
Tests for YOURLS API client
"""
import pytest
from unittest.mock import patch, MagicMock
from yourls_mcp.api.client import YourlsClient


class TestYourlsClient:
    """Test suite for YourlsClient"""
    
    def setup_method(self):
        """Set up test fixtures"""
        self.api_url = "https://example.com/yourls-api.php"
        self.username = "testuser"
        self.password = "testpass"
        self.client = YourlsClient(
            api_url=self.api_url,
            username=self.username,
            password=self.password
        )
    
    @patch('requests.post')
    def test_shorten_url(self, mock_post):
        """Test shortening a URL"""
        # Setup mock
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'status': 'success',
            'shorturl': 'https://example.com/abc',
            'url': 'https://example.com/long-url',
            'title': 'Test Title'
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        # Call the method
        result = self.client.shorten('https://example.com/long-url', 'abc', 'Test Title')
        
        # Assert
        mock_post.assert_called_once()
        assert 'shorturl' in result
        assert result['shorturl'] == 'https://example.com/abc'
    
    @patch('requests.post')
    def test_expand_url(self, mock_post):
        """Test expanding a short URL"""
        # Setup mock
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'keyword': 'abc',
            'shorturl': 'https://example.com/abc',
            'longurl': 'https://example.com/long-url',
            'title': 'Test Title',
            'message': 'success',
            'statusCode': '200'
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        # Call the method
        result = self.client.expand('https://example.com/abc')
        
        # Assert
        mock_post.assert_called_once()
        assert 'longurl' in result
        assert result['longurl'] == 'https://example.com/long-url'
    
    @patch('requests.post')
    def test_url_stats(self, mock_post):
        """Test getting URL stats"""
        # Setup mock
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'link': {
                'shorturl': 'https://example.com/abc',
                'url': 'https://example.com/long-url',
                'title': 'Test Title',
                'clicks': 42
            }
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response
        
        # Call the method
        result = self.client.url_stats('https://example.com/abc')
        
        # Assert
        mock_post.assert_called_once()
        assert 'link' in result