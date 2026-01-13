# API Documentation

The OFAC API provides endpoints for searching and retrieving sanctions data. All endpoints return JSON responses and support standard HTTP methods.

## Base URL

```
https://YOUR-SITE.netlify.app/api
```

## Authentication

Currently, the API does not require authentication for read operations. The optional `/api/update` endpoint may require a shared secret header if configured.

## Endpoints

### Search Entities

Search for entities in the OFAC sanctions list using fuzzy matching.

**Endpoint**: `GET /api/search`

**Parameters**:
- `q` (required): Search query string
- `limit` (optional): Maximum results to return (default: 20, max: 50)

#### JavaScript/Node.js Example

```javascript
// Using fetch API
const searchEntities = async (query, limit = 20) => {
  const params = new URLSearchParams({
    q: query,
    limit: limit
  });
  
  const response = await fetch(`https://YOUR-SITE.netlify.app/api/search?${params}`);
  const data = await response.json();
  
  console.log(`Found ${data.total} results:`);
  data.results.forEach(entity => {
    console.log(`- ${entity.name} (${entity.type}) - Score: ${entity.score}`);
  });
  
  return data;
};

// Usage
searchEntities('Maduro', 10);
```

#### Python Example

```python
import requests

def search_entities(query, limit=20):
    """Search for entities in the OFAC sanctions list"""
    params = {
        'q': query,
        'limit': limit
    }
    
    response = requests.get(
        'https://YOUR-SITE.netlify.app/api/search',
        params=params
    )
    data = response.json()
    
    print(f"Found {data['total']} results:")
    for entity in data['results']:
        print(f"- {entity['name']} ({entity['type']}) - Score: {entity['score']}")
    
    return data

# Usage
search_entities('Maduro', 10)
```

#### cURL Example

```bash
# Basic search
curl "https://YOUR-SITE.netlify.app/api/search?q=Maduro&limit=10"

# Pretty-printed JSON response
curl -s "https://YOUR-SITE.netlify.app/api/search?q=Maduro&limit=10" | jq .
```

**Response**:
```json
{
  "results": [
    {
      "uid": "12345",
      "name": "Nicolás Maduro",
      "type": "Individual",
      "score": 0.98
    },
    {
      "uid": "12346",
      "name": "Nicolás Maduro Moros",
      "type": "Individual",
      "score": 0.85
    }
  ],
  "total": 2
}
```

### Get Entity Details

Retrieve complete details for a specific entity.

**Endpoint**: `GET /api/entity/{uid}`

**Parameters**:
- `uid` (required): Entity unique identifier

#### JavaScript/Node.js Example

```javascript
const getEntity = async (uid) => {
  const response = await fetch(`https://YOUR-SITE.netlify.app/api/entity/${uid}`);
  
  if (!response.ok) {
    throw new Error(`Entity not found: ${uid}`);
  }
  
  const entity = await response.json();
  console.log(`Entity: ${entity.name}`);
  console.log(`Type: ${entity.type}`);
  console.log(`Aliases: ${entity.aliases.join(', ')}`);
  
  return entity;
};

// Usage
getEntity('12345');
```

#### Python Example

```python
def get_entity(uid):
    """Get detailed information about an entity"""
    response = requests.get(
        f'https://YOUR-SITE.netlify.app/api/entity/{uid}'
    )
    
    if response.status_code == 404:
        print(f"Entity not found: {uid}")
        return None
    
    entity = response.json()
    print(f"Entity: {entity['name']}")
    print(f"Type: {entity['type']}")
    print(f"Aliases: {', '.join(entity['aliases'])}")
    
    return entity

# Usage
get_entity('12345')
```

#### cURL Example

```bash
# Get entity details
curl "https://YOUR-SITE.netlify.app/api/entity/12345"

# Pretty-printed response
curl -s "https://YOUR-SITE.netlify.app/api/entity/12345" | jq .
```

**Response**:
```json
{
  "uid": "12345",
  "name": "Nicolás Maduro",
  "type": "Individual",
  "aliases": [
    "Nicolás Maduro Moros",
    "Maduro"
  ],
  "addresses": [
    {
      "address": "Miraflores Palace",
      "city": "Caracas",
      "country": "Venezuela"
    }
  ],
  "dateOfBirth": "1962-11-23",
  "placeOfBirth": "Caracas"
}
```

### Get Metadata

Check dataset metadata and freshness.

**Endpoint**: `GET /api/meta`

#### JavaScript/Node.js Example

```javascript
const getMetadata = async () => {
  const response = await fetch('https://YOUR-SITE.netlify.app/api/meta');
  const meta = await response.json();
  
  console.log(`Last Updated: ${meta.lastUpdated}`);
  console.log(`Total Records: ${meta.recordCount}`);
  console.log(`API Version: ${meta.version}`);
  
  return meta;
};

// Usage
getMetadata();
```

#### Python Example

```python
def get_metadata():
    """Get dataset metadata"""
    response = requests.get('https://YOUR-SITE.netlify.app/api/meta')
    meta = response.json()
    
    print(f"Last Updated: {meta['lastUpdated']}")
    print(f"Total Records: {meta['recordCount']}")
    print(f"API Version: {meta['version']}")
    
    return meta

# Usage
get_metadata()
```

#### cURL Example

```bash
# Get metadata
curl "https://YOUR-SITE.netlify.app/api/meta"

# Pretty-printed response
curl -s "https://YOUR-SITE.netlify.app/api/meta" | jq .
```

**Response**:
```json
{
  "lastUpdated": "2024-01-13T00:00:00Z",
  "recordCount": 12345,
  "version": "1.0.0"
}
```

## Error Handling

All errors return appropriate HTTP status codes with error details:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `400`: Bad Request - Invalid parameters (e.g., missing required query parameter)
- `404`: Not Found - Entity not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Rate Limiting

API requests are rate-limited to 100 requests per minute per IP address. When you exceed the limit, the API returns a `429` status code with a `Retry-After` header indicating when you can retry.

## Best Practices

1. **Cache Results**: Cache search results locally to reduce API calls
2. **Use Appropriate Limits**: Use the `limit` parameter to get only the results you need
3. **Handle Errors**: Always check response status codes and handle errors gracefully
4. **Batch Operations**: If performing multiple searches, consider batching them
5. **Monitor Rate Limits**: Track your API usage to stay within rate limits

---

For more examples and integration guides, see the [Usage Guide](/usage-guide.html).

For interactive API documentation, scroll down to explore all endpoints with try-it-out functionality.
