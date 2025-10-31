

You are a senior WSL+Node fixer. Your task is to make this workspace compile using a Linux Node inside WSL and never the Windows Node under /mnt/c. Work only in bash inside WSL. Make the changes and run the checks below. Do not ask questions. Do not leave TODOs. If a step fails, stop and show the failing command and its output.

Confirm we are in WSL and show current Node resolution

set -euo pipefail
uname -a
echo "PWD=$PWD"
echo "PATH(before)="; echo "$PATH" | tr ':' '\n'
type -a node || true
node -v || true
Sanitize PATH for this shell so no Windows paths can hijack Node

# Drop any /mnt/c entries for this session
SAFE_PATH="$(printf "%s" "$PATH" | tr ':' '\n' | awk '!/^\/mnt\/c\// {print}' | paste -sd: -)"
export PATH="$HOME/.npm-global/bin:$SAFE_PATH"
hash -r
echo "PATH(after)="; echo "$PATH" | tr ':' '\n'
type -a node || true
Remove the Windows-side global node_modules that shipped a bogus node binary

if [ -d /mnt/c/Users/uphol/node_modules ]; then
  rm -rf /mnt/c/Users/uphol/node_modules
fi
Ensure a WSL native Node via nvm, then set it default

if ! command -v nvm &gt;/dev/null 2&gt;&amp;1; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  . "$HOME/.nvm/nvm.sh"
else
  . "$HOME/.nvm/nvm.sh"
fi
nvm install --lts
nvm alias default --lts
node -v
node -p "process.platform + ' ' + process.execPath"
Force npm user prefix to a Linux home path and ensure bash for scripts

mkdir -p "$HOME/.npm-global/bin"
npm config set prefix "$HOME/.npm-global"
grep -q 'PATH=.*\.npm-global/bin' "$HOME/.bashrc" || echo 'export PATH="$HOME/.npm-global/bin:$PATH"' &gt;&gt; "$HOME/.bashrc"

# Project .npmrc for predictable scripts
cat &gt; .npmrc &lt;&lt;'EOF'
prefix=${HOME}/.npm-global
script-shell=/bin/bash
fund=false
audit=false
EOF
Purge Windows-built modules and any accidental node dependency in package.json

rm -rf node_modules package-lock.json
npm pkg delete dependencies.node 2&gt;/dev/null || true
npm pkg delete devDependencies.node 2&gt;/dev/null || true
Clean install on Linux and compile

npm ci
npx tsc -v
npm run compile
Hard guard. If any path like /mnt/c/Users/uphol/node_modules/.bin/../node/bin/node appears in errors, re-sanitize and fail clearly

set +e
npm run compile 2&gt;compile.err || true
set -e
if grep -q '/mnt/c/Users/uphol/node_modules/.bin/../node/bin/node' compile.err; then
  echo "Error: Windows Node hijack detected in stderr"
  echo "Re-sanitizing PATH and stopping"
  SAFE_PATH="$(printf "%s" "$PATH" | tr ':' '\n' | awk '!/^\/mnt\/c\// {print}' | paste -sd: -)"
  export PATH="$HOME/.npm-global/bin:$SAFE_PATH"
  hash -r
  type -a node
  sed -n '1,120p' compile.err
  exit 1
fi
rm -f compile.err
Final diagnostics

echo "Node resolution:"
type -a node
node -p "process.platform + ' ' + process.execPath"
npm -v
echo "OK"


