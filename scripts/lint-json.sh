#!/bin/bash

# JSON Linter - Checks for valid JSON syntax

for file in package.json netlify.toml openapi.yaml .kiro/**/*.json; do
  [ -f "$file" ] || continue
  
  # Skip non-JSON files
  [[ "$file" == *.json ]] || continue
  
  echo "Checking $(basename $file)..."
  
  # Check if file is valid JSON
  if jq empty "$file" 2>/dev/null; then
    echo "  ✓ Valid JSON syntax"
  else
    echo "  ⚠️ Invalid JSON syntax"
    jq empty "$file" 2>&1 | head -3
  fi
  
  # Check for trailing commas
  if grep -q ',[[:space:]]*[}\]]' "$file"; then
    echo "  ⚠️ Possible trailing comma"
  else
    echo "  ✓ No trailing commas"
  fi
  
  # Check for duplicate keys (basic check)
  keys=$(grep -o '"[^"]*":' "$file" | sort)
  if [ "$(echo "$keys" | wc -l)" -ne "$(echo "$keys" | sort -u | wc -l)" ]; then
    echo "  ⚠️ Possible duplicate keys"
  else
    echo "  ✓ No duplicate keys"
  fi
  
  echo ""
done
