# Contributing to YOURLS-MCP

Thank you for your interest in contributing to YOURLS-MCP! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Development Workflow

We follow a standard GitHub flow for contributions:

1. **Fork the repository** (if you don't have push access)
2. **Create a new branch** from `main`:
   ```bash
   git checkout -b type/description
   ```
   Branch naming:
   - `feat/feature-name` for new features
   - `fix/issue-description` for bug fixes
   - `docs/what-changed` for documentation
   - `refactor/what-changed` for code refactoring
   - `test/what-tested` for adding tests

3. **Make your changes**:
   - Follow the code style guidelines in [CLAUDE.md](./CLAUDE.md)
   - Write tests for new functionality
   - Ensure all tests pass

4. **Commit your changes**:
   - Use conventional commits format:
     ```
     type(scope): short description
     
     Longer description if needed
     ```
   - Keep commits focused and atomic
   - Refer to issues with `#issue-number`

5. **Push your branch**:
   ```bash
   git push origin your-branch-name
   ```

6. **Create a Pull Request** against the `main` branch
   - Provide a clear description of the changes
   - Link any relevant issues
   - Request review from a maintainer

7. **Address review feedback** if requested

8. Once approved, a maintainer will merge your PR

## Setting Up Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/kesslerio/yourls-mcp.git
   cd yourls-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a local configuration file for testing:
   ```bash
   # Create a test-server.sh script with your YOURLS credentials:
   #!/bin/bash
   export YOURLS_API_URL="https://your-yourls-instance.com/yourls-api.php"
   export YOURLS_AUTH_METHOD="signature"
   export YOURLS_SIGNATURE_TOKEN="your-secret-token"
   node yourls-mcp.js
   ```

4. Make the script executable:
   ```bash
   chmod +x test-server.sh
   ```

5. Run the server for testing:
   ```bash
   ./test-server.sh
   ```

## Project Structure

- `src/`: Core source code
  - `api.js`: YOURLS API client
  - `config.js`: Configuration management
  - `index.js`: Main MCP server
  - `tools/`: Tool implementations
- `yourls-mcp.js`: CLI entry point
- `tests/`: Test files

## Testing

We use Jest for testing. Run tests with:

```bash
npm test
```

Make sure to write tests for new functionality. Test files should be placed in the `tests/` directory mirroring the structure of the `src/` directory.

## Documentation

- Update README.md with any new features or changes
- Add JSDoc comments to all functions and classes
- Update USAGE.md with examples of new functionality

## Release Process

Releases are managed by the project maintainers. We follow semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Incompatible API changes
- MINOR: Backward-compatible new functionality
- PATCH: Backward-compatible bug fixes

## Getting Help

If you have questions or need help, please:
1. Check existing issues and documentation
2. Open a new issue if you can't find an answer

## Thank You

Your contributions are what make open source great! Thank you for taking the time to contribute to YOURLS-MCP.