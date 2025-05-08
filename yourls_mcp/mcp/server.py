"""
MCP server implementation for YOURLS
"""
import sys
import json
from typing import Dict, Any, List, Callable, Optional
from mcp import FastMCP, InvocationResult

from ..api import YourlsClient
from ..config import load_config


def create_server(config_path: Optional[str] = None) -> FastMCP:
    """
    Create and configure an MCP server for YOURLS
    
    Args:
        config_path: Optional path to config file
        
    Returns:
        Configured MCP server instance
    """
    # Load configuration
    config = load_config(config_path)
    
    if 'yourls' not in config:
        raise ValueError("Missing YOURLS configuration. Please check your config file.")
    
    yourls_config = config['yourls']
    required_keys = ['api_url', 'username', 'password']
    missing_keys = [key for key in required_keys if key not in yourls_config]
    
    if missing_keys:
        raise ValueError(f"Missing required YOURLS configuration keys: {', '.join(missing_keys)}")
    
    # Create YOURLS client
    client = YourlsClient(
        api_url=yourls_config['api_url'],
        username=yourls_config['username'],
        password=yourls_config['password']
    )
    
    # Create MCP server
    server = FastMCP(
        name="YOURLS URL Shortener",
        version="0.1.0",
    )
    
    # Register tools
    register_tools(server, client)
    
    return server


def register_tools(server: FastMCP, client: YourlsClient) -> None:
    """
    Register all MCP tools for the YOURLS API
    
    Args:
        server: MCP server instance
        client: YOURLS API client
    """
    # Shorten URL tool
    @server.tool(
        "shorten_url",
        {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to shorten"
                },
                "keyword": {
                    "type": "string",
                    "description": "Optional custom keyword for the short URL"
                },
                "title": {
                    "type": "string",
                    "description": "Optional title for the URL"
                }
            },
            "required": ["url"]
        },
        description="Shorten a long URL using YOURLS"
    )
    def shorten_url(url: str, keyword: Optional[str] = None, title: Optional[str] = None) -> InvocationResult:
        try:
            result = client.shorten(url, keyword, title)
            
            if 'shorturl' in result:
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "success",
                        "shorturl": result['shorturl'],
                        "url": result.get('url', url),
                        "title": result.get('title', title or '')
                    })
                )
            else:
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "error",
                        "message": result.get('message', 'Unknown error'),
                        "code": result.get('code', 'unknown')
                    })
                )
                
        except Exception as e:
            return InvocationResult(
                content_type="application/json",
                content=json.dumps({
                    "status": "error",
                    "message": str(e)
                })
            )
    
    # Expand URL tool
    @server.tool(
        "expand_url",
        {
            "type": "object",
            "properties": {
                "shorturl": {
                    "type": "string",
                    "description": "The short URL or keyword to expand"
                }
            },
            "required": ["shorturl"]
        },
        description="Expand a short URL to its original long URL"
    )
    def expand_url(shorturl: str) -> InvocationResult:
        try:
            result = client.expand(shorturl)
            
            if 'longurl' in result:
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "success",
                        "shorturl": result.get('shorturl', shorturl),
                        "longurl": result['longurl'],
                        "title": result.get('title', '')
                    })
                )
            else:
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "error",
                        "message": result.get('message', 'Unknown error'),
                        "code": result.get('code', 'unknown')
                    })
                )
                
        except Exception as e:
            return InvocationResult(
                content_type="application/json",
                content=json.dumps({
                    "status": "error",
                    "message": str(e)
                })
            )
    
    # URL Stats tool
    @server.tool(
        "url_stats",
        {
            "type": "object",
            "properties": {
                "shorturl": {
                    "type": "string",
                    "description": "The short URL or keyword to get stats for"
                }
            },
            "required": ["shorturl"]
        },
        description="Get statistics for a shortened URL"
    )
    def url_stats(shorturl: str) -> InvocationResult:
        try:
            result = client.url_stats(shorturl)
            
            if 'link' in result:
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "success",
                        "shorturl": result.get('shorturl', shorturl),
                        "clicks": result.get('clicks', 0),
                        "title": result.get('title', ''),
                        "longurl": result.get('url', '')
                    })
                )
            else:
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "error",
                        "message": result.get('message', 'Unknown error'),
                        "code": result.get('code', 'unknown')
                    })
                )
                
        except Exception as e:
            return InvocationResult(
                content_type="application/json",
                content=json.dumps({
                    "status": "error",
                    "message": str(e)
                })
            )
            
    # DB Stats tool
    @server.tool(
        "db_stats",
        {
            "type": "object",
            "properties": {}
        },
        description="Get global statistics for the YOURLS instance"
    )
    def db_stats() -> InvocationResult:
        try:
            result = client.db_stats()
            
            if 'db-stats' in result:
                stats = result['db-stats']
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "success",
                        "total_links": stats.get('total_links', 0),
                        "total_clicks": stats.get('total_clicks', 0)
                    })
                )
            else:
                return InvocationResult(
                    content_type="application/json",
                    content=json.dumps({
                        "status": "error",
                        "message": result.get('message', 'Unknown error'),
                        "code": result.get('code', 'unknown')
                    })
                )
                
        except Exception as e:
            return InvocationResult(
                content_type="application/json",
                content=json.dumps({
                    "status": "error",
                    "message": str(e)
                })
            )