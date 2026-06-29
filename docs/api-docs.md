# API Documentation

The OFAC API provides endpoints for searching and retrieving sanctions data. All endpoints return JSON responses and support standard HTTP methods.

## Base URL

```
https://sdn-openapi.netlify.app/api
```

## Authentication

Read endpoints do not require authentication. Manual `/api/update` calls require the configured update secret via `X-Update-Secret`, `X-API-Key`, `Authorization: Bearer ...`, or a JSON `secret` body.

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
  
  const response = await fetch(`https://sdn-openapi.netlify.app/api/search?${params}`);
  const data = await response.json();
  
  console.log(`Found ${data.count} results:`);
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
        'https://sdn-openapi.netlify.app/api/search',
        params=params
    )
    data = response.json()
    
    print(f"Found {data['count']} results:")
    for entity in data['results']:
        print(f"- {entity['name']} ({entity['type']}) - Score: {entity['score']}")
    
    return data

# Usage
search_entities('Maduro', 10)
```

#### cURL Example

```bash
# Basic search
curl "https://sdn-openapi.netlify.app/api/search?q=Maduro&limit=10"

# Pretty-printed JSON response
curl -s "https://sdn-openapi.netlify.app/api/search?q=Maduro&limit=10" | jq .
```

**Response**:
```json
{
  "ok": true,
  "q": "Maduro",
  "count": 2,
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
  ]
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
  const response = await fetch(`https://sdn-openapi.netlify.app/api/entity/${uid}`);
  
  if (!response.ok) {
    throw new Error(`Entity not found: ${uid}`);
  }
  
  const data = await response.json();
  const entity = data.entity;
  console.log(`Entity: ${entity.name}`);
  console.log(`Type: ${entity.type}`);
  console.log(`Aliases: ${entity.aka.join(', ')}`);
  
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
        f'https://sdn-openapi.netlify.app/api/entity/{uid}'
    )
    
    if response.status_code == 404:
        print(f"Entity not found: {uid}")
        return None
    
    data = response.json()
    entity = data['entity']
    print(f"Entity: {entity['name']}")
    print(f"Type: {entity['type']}")
    print(f"Aliases: {', '.join(entity['aka'])}")
    
    return entity

# Usage
get_entity('12345')
```

#### cURL Example

```bash
# Get entity details
curl "https://sdn-openapi.netlify.app/api/entity/12345"

# Pretty-printed response
curl -s "https://sdn-openapi.netlify.app/api/entity/12345" | jq .
```

**Response**:
```json
{
  "ok": true,
  "entity": {
    "uid": "12345",
    "name": "Nicolás Maduro",
    "type": "Individual",
    "aka": [
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
    "programs": ["VENEZUELA"]
  }
}
```

### Get Metadata

Check dataset metadata and freshness.

**Endpoint**: `GET /api/meta`

#### JavaScript/Node.js Example

```javascript
const getMetadata = async () => {
  const response = await fetch('https://sdn-openapi.netlify.app/api/meta');
  const meta = await response.json();
  
  console.log(`Fetched At: ${meta.fetchedAt}`);
  console.log(`Total Entities: ${meta.counts.entities}`);
  console.log(`SDN Hash: ${meta.hashes.sdnSha256}`);
  
  return meta;
};

// Usage
getMetadata();
```

#### Python Example

```python
def get_metadata():
    """Get dataset metadata"""
    response = requests.get('https://sdn-openapi.netlify.app/api/meta')
    meta = response.json()
    
    print(f"Fetched At: {meta['fetchedAt']}")
    print(f"Total Entities: {meta['counts']['entities']}")
    print(f"SDN Hash: {meta['hashes']['sdnSha256']}")
    
    return meta

# Usage
get_metadata()
```

#### cURL Example

```bash
# Get metadata
curl "https://sdn-openapi.netlify.app/api/meta"

# Pretty-printed response
curl -s "https://sdn-openapi.netlify.app/api/meta" | jq .
```

**Response**:
```json
{
  "fetchedAt": "2026-06-29T06:00:35.535Z",
  "source": {
    "sdnUrl": "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV"
  },
  "counts": {
    "entities": 19122
  },
  "hashes": {
    "sdnSha256": "..."
  },
  "delta": {
    "addedCount": 0,
    "removedCount": 0,
    "changedCount": 0
  }
}
```

## Error Handling

All errors return appropriate HTTP status codes with error details:

```json
{
  "ok": false,
  "error": "Error message",
  "detail": {}
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
