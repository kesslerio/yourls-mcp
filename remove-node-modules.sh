#!/bin/bash

# Remove node_modules from Git
git rm -r --cached node_modules
git commit -m "Remove node_modules from Git repository"
git push origin feat/duplicate-url-handling

echo "node_modules has been removed from Git tracking"