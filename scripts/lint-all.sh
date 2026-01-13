#!/bin/bash

# Master Linter - Runs all linting scripts

echo "🔍 Running all linters...\n"

scripts=(
  "lint-html.sh"
  "lint-css.sh"
  "lint-markdown.sh"
  "lint-json.sh"
  "lint-yaml.sh"
  "lint-typescript.sh"
)

for script in "${scripts[@]}"; do
  if [ -f "scripts/$script" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running $script..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
    bash "scripts/$script"
  fi
done

echo "✅ Linting complete!"
