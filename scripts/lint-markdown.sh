#!/bin/bash

# Markdown Linter - Checks for common Markdown issues

for file in docs/*.md README.md .kiro/specs/**/*.md; do
  [ -f "$file" ] || continue
  
  echo "Checking $(basename $file)..."
  
  # Check for proper heading hierarchy (no skipping levels)
  if grep -q '^## ' "$file" && ! grep -q '^# ' "$file"; then
    echo "  ⚠️ Document starts with ## instead of #"
  else
    echo "  ✓ Heading hierarchy looks good"
  fi
  
  # Check for unclosed code blocks
  backtick_count=$(grep -o '```' "$file" | wc -l)
  if [ $((backtick_count % 2)) -eq 0 ]; then
    echo "  ✓ Code blocks balanced ($((backtick_count / 2)) blocks)"
  else
    echo "  ⚠️ Unclosed code block (odd number of backticks)"
  fi
  
  # Check for unclosed links
  open_brackets=$(grep -o '\[' "$file" | wc -l)
  close_brackets=$(grep -o '\]' "$file" | wc -l)
  if [ "$open_brackets" -eq "$close_brackets" ]; then
    echo "  ✓ Link brackets balanced"
  else
    echo "  ⚠️ Unbalanced link brackets (open: $open_brackets, close: $close_brackets)"
  fi
  
  # Check for trailing whitespace
  if grep -q '[[:space:]]$' "$file"; then
    echo "  ⚠️ Trailing whitespace found"
  else
    echo "  ✓ No trailing whitespace"
  fi
  
  # Check for multiple consecutive blank lines
  if grep -q '^[[:space:]]*$' "$file" | head -1 | grep -q '^[[:space:]]*$'; then
    echo "  ⚠️ Multiple consecutive blank lines found"
  else
    echo "  ✓ No excessive blank lines"
  fi
  
  echo ""
done
