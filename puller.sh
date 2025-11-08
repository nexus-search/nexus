#!/usr/bin/env bash
set -euo pipefail

# Save current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)

echo "📋 Listing branches (excluding 'main'):"
BRANCHES=$(git branch --format="%(refname:short)" | grep -v "^main$")

if [ -z "$BRANCHES" ]; then
    echo "⚠️ No branches found (other than 'main')."
    cd - >/dev/null
    exit 0
fi

echo "$BRANCHES"
echo ""

for BRANCH in $BRANCHES; do
    read -p "Do you want to pull latest changes from 'develop' into '$BRANCH'? [y/N]: " APPROVE
    case "$APPROVE" in
        [yY][eE][sS]|[yY])
            echo "➡️ Switching to branch '$BRANCH'..."
            git checkout "$BRANCH"

            echo "⬇️ Pulling latest changes from 'develop' into '$BRANCH'..."
            git pull origin develop

            echo "✅ Done with '$BRANCH'."
            echo "---------------------------"
            ;;
        *)
            echo "⏭ Skipping branch '$BRANCH'."
            ;;
    esac
done

# Switch back
git checkout "$current_branch" >/dev/null 2>&1
echo "🔙 Back to original branch: $current_branch"

cd - >/dev/null
