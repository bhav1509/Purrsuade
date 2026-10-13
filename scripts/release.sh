#!/usr/bin/env bash
# Publish a new version of Purrsuade (Semantic Versioning, MAJOR.MINOR.PATCH): bump the version, note it in
# CHANGELOG.md, commit, tag vX.Y.Z and push.
#
#   scripts/release.sh patch "Fix the recording crash"   # 0.1.0 -> 0.1.1  (bug fixes)
#   scripts/release.sh minor "Add keyboard dictation"     # 0.1.1 -> 0.2.0  (new features)
#   scripts/release.sh major "Public launch"              # 0.2.0 -> 1.0.0
#   scripts/release.sh 1.0.0 "Public launch"              # set an exact version
#
# The version lives in app.js (APP_VERSION + APP_RELEASED, shown in Settings → About) and names the offline
# cache in sw.js, so phones pick up the new files on their next visit. GitHub Pages redeploys main in a minute
# or two. Extra commit-message lines (e.g. a Co-Authored-By trailer) can be passed in RELEASE_TRAILER.
set -euo pipefail
cd "$(dirname "$0")/.."

bump=${1:?Usage: scripts/release.sh patch|minor|major|X.Y.Z "summary of the changes"}
msg=${2:?Give a one-line summary of the changes}

cur=$(sed -n "s/^const APP_VERSION='\([0-9]*\.[0-9]*\.[0-9]*\)';.*/\1/p" app.js)
[[ -n "$cur" ]] || { echo "Couldn't find APP_VERSION='X.Y.Z' in app.js" >&2; exit 1; }
IFS=. read -r ma mi pa <<<"$cur"
case "$bump" in
  patch) next="$ma.$mi.$((pa+1))" ;;
  minor) next="$ma.$((mi+1)).0" ;;
  major) next="$((ma+1)).0.0" ;;
  [0-9]*.[0-9]*.[0-9]*) next=$bump ;;
  *) echo "First argument must be patch, minor, major or a version like 1.0.0" >&2; exit 1 ;;
esac
git rev-parse "v$next" >/dev/null 2>&1 && { echo "Tag v$next already exists" >&2; exit 1; }
today=$(date +%Y-%m-%d)

node --check app.js && node --check room-art.js

# Bump the version, release date and cache name (BSD/macOS sed).
sed -i '' "s/^const APP_VERSION='$cur';/const APP_VERSION='$next';/" app.js
sed -i '' "s/^const APP_RELEASED='[^']*';/const APP_RELEASED='$today';/" app.js
sed -i '' "s/^const CACHE='[^']*';/const CACHE='purrsuade-v$next';/" sw.js

# Newest entry goes above the previous release in CHANGELOG.md.
python3 - "$next" "$msg" "$today" <<'PY'
import sys
ver,msg,day=sys.argv[1:4]
path='CHANGELOG.md';text=open(path).read()
entry=f"## v{ver} · {day}\n- {msg}\n\n"
i=text.find('\n## ')+1 if '\n## ' in text else len(text)
open(path,'w').write(text[:i]+entry+text[i:])
PY

git add -A
if [[ -n "${RELEASE_TRAILER:-}" ]]; then git commit -q -m "v$next: $msg" -m "$RELEASE_TRAILER"; else git commit -q -m "v$next: $msg"; fi
git tag -a "v$next" -m "v$next: $msg"
git push -q origin main "v$next"
echo "Released v$next: $msg"
