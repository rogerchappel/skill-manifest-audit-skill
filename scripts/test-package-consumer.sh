#!/usr/bin/env bash
set -euo pipefail

project_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
consumer_root=$(mktemp -d "${TMPDIR:-/tmp}/skill-manifest-audit-consumer.XXXXXX")
trap 'rm -rf "$consumer_root"' EXIT

package_dir="$consumer_root/package"
app_dir="$consumer_root/app"
mkdir -p "$package_dir" "$app_dir"

tarball_name=$(cd "$project_dir" && npm pack --pack-destination "$package_dir" --silent)
tarball="$package_dir/$tarball_name"

for runtime_file in \
  package/bin/skill-manifest-audit.js \
  package/lib/audit.js \
  package/SKILL.md \
  package/README.md \
  package/LICENSE; do
  tar -tzf "$tarball" | grep -Fxq "$runtime_file"
done

cp -R "$project_dir/fixtures/good-skill" "$app_dir/fixture"
cd "$app_dir"
npm init --yes --silent >/dev/null
npm install --silent --ignore-scripts "$tarball"

cli="$app_dir/node_modules/.bin/skill-manifest-audit"
"$cli" --help | grep -Fq 'Usage: skill-manifest-audit'
test "$("$cli" --version)" = '0.1.0'
"$cli" fixture --format json | grep -Fq '"status": "pass"'
"$cli" fixture --format markdown | grep -Fq 'Status: **pass**'

echo 'packaged CLI consumer test passed'
