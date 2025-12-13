#!/bin/bash
set -euo pipefail

branches=$(git for-each-ref --format='%(refname:short)' refs/heads/)

for branch in $branches; do
  if [[ "$branch" == "main" ]]; then
    echo "⚡ Skipping protected branch: 🌳 $branch"
    continue
  fi

  echo "🚀 Pushing branch: 🌿 $branch ..."
  git push origin "$branch"

  echo "✅ Done with $branch"
  echo "⏳ Waiting a bit before the next push..."
  sleep 1
  echo "----------------------------"
done

echo "🎉 All branches (except main) have been pushed!"

cd - >/dev/null
