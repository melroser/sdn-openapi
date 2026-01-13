#!/bin/bash

# CSS Linter - Checks for common CSS issues

for file in public/css/*.css docs/**/*.css; do
  [ -f "$file" ] || continue
  
  echo "Checking $(basename $file)..."
  
  # Check for unclosed braces
  open_braces=$(grep -o '{' "$file" | wc -l)
  close_braces=$(grep -o '}' "$file" | wc -l)
  if [ "$open_braces" -eq "$close_braces" ]; then
    echo "  ✓ Braces balanced ($open_braces pairs)"
  else
    echo "  ⚠️ Unbalanced braces (open: $open_braces, close: $close_braces)"
  fi
  
  # Check for missing semicolons in property declarations
  if grep -q '[a-z-]*:[^;]*[^;{]$' "$file"; then
    echo "  ⚠️ Possible missing semicolons"
  else
    echo "  ✓ Semicolons appear complete"
  fi
  
  # Check for common typos
  if grep -qi 'colr:' "$file"; then
    echo "  ⚠️ Possible typo: 'colr' should be 'color'"
  fi
  
  if grep -qi 'backgrond:' "$file"; then
    echo "  ⚠️ Possible typo: 'backgrond' should be 'background'"
  fi
  
  # Check for unused selectors (basic check)
  if grep -q '^[[:space:]]*{' "$file"; then
    echo "  ⚠️ Empty selector found"
  else
    echo "  ✓ No empty selectors"
  fi
  
  echo ""
done
