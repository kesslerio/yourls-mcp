#!/usr/bin/env python
"""
Main entry point for the YOURLS-MCP server
"""
import sys
import os
import argparse
from typing import List, Optional

from yourls_mcp.mcp import create_server


def main(args: Optional[List[str]] = None) -> None:
    """
    Main entry point for the YOURLS-MCP server
    
    Args:
        args: Command line arguments (defaults to sys.argv)
    """
    parser = argparse.ArgumentParser(description="YOURLS-MCP: URL shortening for Claude Desktop")
    parser.add_argument(
        "--config", 
        help="Path to configuration file"
    )
    parsed_args = parser.parse_args(args)
    
    try:
        server = create_server(parsed_args.config)
        server.run()
    except Exception as e:
        print(f"Error starting YOURLS-MCP server: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()