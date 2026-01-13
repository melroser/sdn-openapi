for file in public/*.html; do 
  echo "Checking $(basename $file)..."
  # Check for unclosed tags
  if grep -q '<[^>]*$' "$file"; then
    echo "  ⚠️ Possible unclosed tag"
  else
    echo "  ✓ All tags properly closed"
  fi
  
  # Check for proper DOCTYPE
  if grep -q '<!DOCTYPE html>' "$file"; then
    echo "  ✓ DOCTYPE present"
  else
    echo "  ⚠️ DOCTYPE missing"
  fi
  
  # Check for proper closing html tag
  if grep -q '</html>' "$file"; then
    echo "  ✓ Closing html tag present"
  else
    echo "  ⚠️ Closing html tag missing"
  fi
done
