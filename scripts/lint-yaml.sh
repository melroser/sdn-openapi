#!/bin/bash

# YAML Linter - Checks for common YAML issues

for file in netlify.toml openapi.yaml .kiro/**/*.yaml .kiro/**/*.yml; do
  [ -f "$file" ] || continue
  
  # Skip non-YAML files
  [[ "$file" == *.yaml ]] || [[ "$file" == *.yml ]] || [[ "$file" == *.toml ]] || continue
  
  echo "Checking $(basename $file)..."
  
  # Check for proper indentation (2 or 4 spaces)
  if grep -q '^	' "$file"; then
    echo "  ⚠️ Tabs found (use spaces instead)"
  else
    echo "  ✓ No tabs in indentation"
  fi
  
  # Check for inconsistent indentation
  indent_pattern=$(grep -o '^[[:space:]]*' "$file" | sort -u | grep -v '^$' | head -5)
  if echo "$indent_pattern" | grep -q '   ' && echo "$indent_pattern" | grep -q '    '; then
    echo "  ⚠️ Inconsistent indentation (mixing 3 and 4 spaces)"
  else
    echo "  ✓ Consistent indentation"
  fi
  
  # Check for trailing whitespace
  if grep -q '[[:space:]]$' "$file"; then
    echo "  ⚠️ Trailing whitespace found"
  else
    echo "  ✓ No trailing whitespace"
  fi
  
  # Check for unclosed quotes
  single_quotes=$(grep -o "'" "$file" | wc -l)
  double_quotes=$(grep -o '"' "$file" | wc -l)
  if [ $((single_quotes % 2)) -eq 0 ] && [ $((double_quotes % 2)) -eq 0 ]; then
    echo "  ✓ Quotes balanced"
  else
    echo "  ⚠️ Unbalanced quotes"
  fi
  
  echo ""
done
