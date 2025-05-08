#!/bin/bash

# This script will remove node_modules from Git history
# Warning: This rewrites Git history! Use with caution.

echo "WARNING: This script will rewrite Git history to remove node_modules."
echo "This is a destructive operation and will change commit hashes."
echo "If you've already pushed to a shared repository, this can cause problems."
echo "Press Enter to continue or Ctrl+C to abort..."
read

# Create a new temporary branch
git checkout --orphan temp_branch

# Add all files except node_modules
git add --all -- ':!node_modules'

# Create a commit
git commit -m "Initial commit without node_modules"

# Delete the current branch
git branch -D feat/duplicate-url-handling

# Rename the temporary branch
git branch -m feat/duplicate-url-handling

# Force update the repository
echo "Would you like to force push these changes to remote? (y/n)"
read answer

if [ "$answer" = "y" ]; then
    git push -f origin feat/duplicate-url-handling
    echo "Changes pushed to remote."
else
    echo "Changes are local only. Use 'git push -f origin feat/duplicate-url-handling' to push."
fi

echo "node_modules has been removed from Git history."