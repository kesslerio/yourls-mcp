"""
Configuration handling for YOURLS-MCP
"""
import os
import yaml
from typing import Dict, Any
from dotenv import load_dotenv


def load_config(config_path: str = None) -> Dict[str, Any]:
    """
    Load configuration from config file and environment variables
    
    Args:
        config_path: Path to config.yaml file (defaults to looking in standard locations)
        
    Returns:
        Configuration dictionary
    """
    # Load environment variables from .env if it exists
    load_dotenv()
    
    config = {}
    
    # Default config paths to check
    paths = [
        config_path,
        os.path.join(os.getcwd(), 'config.yaml'),
        os.path.expanduser('~/.config/yourls-mcp/config.yaml'),
    ]
    
    # Try to load config from first available path
    for path in paths:
        if path and os.path.exists(path):
            with open(path, 'r') as f:
                config = yaml.safe_load(f)
            break
    
    # Override with environment variables if set
    env_mapping = {
        'YOURLS_API_URL': ('yourls', 'api_url'),
        'YOURLS_USERNAME': ('yourls', 'username'),
        'YOURLS_PASSWORD': ('yourls', 'password'),
    }
    
    for env_var, config_path in env_mapping.items():
        if env_var in os.environ:
            # Initialize nested dict if needed
            current = config
            for key in config_path[:-1]:
                if key not in current:
                    current[key] = {}
                current = current[key]
            
            # Set the value
            current[config_path[-1]] = os.environ[env_var]
    
    return config