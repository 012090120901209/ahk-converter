#!/bin/bash

# Remove user-specific paths
git filter-branch --force --index-filter \
"git rm --cached --ignore-unmatch .vscode/launch.json" \
--prune-empty --tag-name-filter cat -- --all

# Remove any instances of the username "uphol"
git filter-branch --force --index-filter \
"git ls-files -z | xargs -0 sed -i 's/uphol/USER/g'" \
--prune-empty --tag-name-filter cat -- --all

# Remove absolute file paths
git filter-branch --force --index-filter \
"git ls-files -z | xargs -0 sed -i 's|/Users/[^/]*/Documents/|/PATH/TO/|g'" \
--prune-empty --tag-name-filter cat -- --all