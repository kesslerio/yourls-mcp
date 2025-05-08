"""
Tests for MCP server implementation
"""
import pytest
import json
from unittest.mock import patch, MagicMock

from yourls_mcp.mcp.server import create_server, register_tools


class TestMcpServer:
    """Test suite for MCP server implementation"""
    
    @patch('yourls_mcp.mcp.server.load_config')
    @patch('yourls_mcp.mcp.server.YourlsClient')
    @patch('yourls_mcp.mcp.server.FastMCP')
    def test_create_server(self, mock_fast_mcp, mock_yourls_client, mock_load_config):
        """Test creating an MCP server"""
        # Setup mocks
        mock_load_config.return_value = {
            'yourls': {
                'api_url': 'https://example.com/yourls-api.php',
                'username': 'testuser',
                'password': 'testpass'
            }
        }
        mock_server = MagicMock()
        mock_fast_mcp.return_value = mock_server
        
        # Call the function
        server = create_server()
        
        # Assert
        mock_load_config.assert_called_once()
        mock_yourls_client.assert_called_once_with(
            api_url='https://example.com/yourls-api.php',
            username='testuser',
            password='testpass'
        )
        mock_fast_mcp.assert_called_once()
        assert server == mock_server
    
    @patch('yourls_mcp.mcp.server.load_config')
    def test_create_server_missing_config(self, mock_load_config):
        """Test creating a server with missing configuration"""
        # Setup mock
        mock_load_config.return_value = {}
        
        # Call the function and assert
        with pytest.raises(ValueError, match="Missing YOURLS configuration"):
            create_server()
    
    @patch('yourls_mcp.mcp.server.load_config')
    def test_create_server_missing_keys(self, mock_load_config):
        """Test creating a server with missing configuration keys"""
        # Setup mock
        mock_load_config.return_value = {
            'yourls': {
                'api_url': 'https://example.com/yourls-api.php'
            }
        }
        
        # Call the function and assert
        with pytest.raises(ValueError, match="Missing required YOURLS configuration keys"):
            create_server()