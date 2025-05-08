# YOURLS-MCP Development Guidelines

## CODE PRINCIPLES
- **Python**: Concise, clear, modular, readable. Functions > classes for stateless operations.
- **Data**: Use appropriate data structures and validation.
- **API**: Implement resilient clients with proper error handling and retries.
- **Config**: Use configuration files and environment variables. No hardcoding.
- **Cache**: Implement caching for expensive API operations.
- **Errors**: Use specific `try/except`. Log errors properly. Allow continuation on non-critical errors.
- **Logging**: Implement structured logging with trace IDs.

## PROJECT SPECIFICS
- **Core Structure**: 
  - `yourls_mcp/api/`: YOURLS API client and utilities
  - `yourls_mcp/mcp/`: MCP server implementation
  - `yourls_mcp/config/`: Configuration handling
- **Dependencies**: `mcp`, `requests`, `pyyaml`, `python-dotenv`. Add new dependencies to `requirements.txt`.
- **Parameters**: Follow consistent parameter ordering in functions.
- **Tests**: Create tests in `tests/` directory.

## CODE STYLE/STRUCTURE
- **Single Responsibility Principle**: Keep files and functions focused.
- **Naming**: 
  - `PascalCase` for classes
  - `snake_case` for functions, variables, files
  - `UPPER_SNAKE_CASE` for constants
  - Tests: `test_*.py`/`test_*()`
- **Formatting**: Follow PEP 8, 100 chars/line max.
- **Types/Docs**: Mandatory type hints. Google-style docstrings.
- **Imports**: stdlib -> external -> internal.
- **Testing**: Use `pytest`. Mirror directory structure in tests.

## GIT WORKFLOW
- **Main**: Stable branch. No direct commits.
- **Branches**: `type/description` (e.g., `feat/mcp-server-implementation`) for ALL work.
- **Sync**: Rebase frequently on `main`.
- **Commits**: Atomic, descriptive. Use conventional commits style (`feat:`, `fix:`, etc.).
- **Cleanup**: Delete merged branches.

## GITHUB ISSUES & DOCS
1. **Issues**: Every task MUST have a GitHub Issue. Search existing issues before creating new ones.
2. **Issue Content**: Document plans, designs, progress in issue comments.
3. **Temp Files**: Use `/tmp/` for drafting Issue/PR content.
4. **GitHub CLI**: Use `gh` for Issue/PR management when possible.

## MCP SERVER IMPLEMENTATION
- Follow the MCP protocol documentation
- Implement tools for YOURLS integration:
  - URL shortening
  - URL expansion
  - Statistics retrieval

## CONFIGURATION
- Use a combination of YAML config and environment variables
- Support multiple configuration locations
- Protect sensitive information (credentials)