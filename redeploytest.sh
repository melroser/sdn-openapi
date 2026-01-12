git add netlify/functions/ofac-update.ts
git commit -m "Normalize SDN CSV headers; fix entity extraction"
git push origin master

curl -i 'https://sdn-openapi.netlify.app/api/update'
curl -i 'https://sdn-openapi.netlify.app/api/meta'
curl -i 'https://sdn-openapi.netlify.app/api/search?q=bob'
