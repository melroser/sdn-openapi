#!/bin/bash

# TypeScript/JavaScript Linter - Checks for common syntax issues

for file in netlify/functions/*.ts netlify/tests/*.ts docs/*.js netlify/tests/*.js; do
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
  
  # Check for unclosed parentheses
  open_parens=$(grep -o '(' "$file" | wc -l)
  close_parens=$(grep -o ')' "$file" | wc -l)
  if [ "$open_parens" -eq "$close_parens" ]; then
    echo "  ✓ Parentheses balanced ($open_parens pairs)"
  else
    echo "  ⚠️ Unbalanced parentheses (open: $open_parens, close: $close_parens)"
  fi
  
  # Check for unclosed brackets
  open_brackets=$(grep -o '\[' "$file" | wc -l)
  close_brackets=$(grep -o '\]' "$file" | wc -l)
  if [ "$open_brackets" -eq "$close_brackets" ]; then
    echo "  ✓ Brackets balanced ($open_brackets pairs)"
  else
    echo "  ⚠️ Unbalanced brackets (open: $open_brackets, close: $close_brackets)"
  fi
  
  # Check for missing semicolons (basic check)
  if grep -q '[a-zA-Z0-9_)]\s*$' "$file" | grep -v '^[[:space:]]*//' | grep -v '^[[:space:]]*\*'; then
    echo "  ⚠️ Possible missing semicolons"
  else
    echo "  ✓ Semicolons appear complete"
  fi
  
  # Check for console.log statements (should be removed in production)
  if grep -q 'console\.log' "$file"; then
    echo "  ⚠️ console.log statements found (remove before production)"
  else
    echo "  ✓ No console.log statements"
  fi
  
  # Check for trailing whitespace
  if grep -q '[[:space:]]$' "$file"; then
    echo "  ⚠️ Trailing whitespace found"
  else
    echo "  ✓ No trailing whitespace"
  fi
  
  echo ""
done
