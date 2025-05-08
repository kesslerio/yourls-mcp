from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh.readlines()]

setup(
    name="yourls-mcp",
    version="0.1.0",
    author="Martin Kessler",
    author_email="example@example.com",
    description="MCP server for YOURLS URL shortening integration with Claude Desktop",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/kesslerio/yourls-mcp",
    packages=find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "yourls-mcp=yourls_mcp.server:main",
        ],
    },
)