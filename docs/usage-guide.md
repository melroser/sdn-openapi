# OFAC API Usage Guide

Welcome to the OFAC API Usage Guide. This guide provides practical examples and best practices for integrating the OFAC API into your applications.

---

## Quick Start

### Installation

The OFAC API is a REST API—no installation required. Simply make HTTP requests to the API endpoints.

### Your First Request

Get started in seconds with a simple search request:

```bash
curl "https://YOUR-SITE.netlify.app/api/search?q=putin"
```

```javascript
// JavaScript/Node.js
const response = await fetch('https://YOUR-SITE.netlify.app/api/search?q=putin');
const data = await response.json();
console.log(data);
```

```python
# Python
import requests

response = requests.get('https://YOUR-SITE.netlify.app/api/search?q=putin')
data = response.json()
print(data)
```

### Response Format

All responses are JSON with a consistent structure:

```json
{
  "results": [
    {
      "uid": "12345",
      "name": "Vladimir Putin",
      "type": "Individual",
      "score": 0.98
    }
  ],
  "total": 1
}
```

---

## Searching for Entities

### Basic Search

Search for entities by name using fuzzy matching. The API returns results ranked by relevance.

```bash
curl "https://YOUR-SITE.netlify.app/api/search?q=gazprom"
```

```javascript
// Search for a company
async function searchEntities(query) {
  const response = await fetch(
    `https://YOUR-SITE.netlify.app/api/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.results;
}

// Usage
const results = await searchEntities('gazprom');
results.forEach(entity => {
  console.log(`${entity.name} (${entity.type}) - Score: ${entity.score}`);
});
```

```python
# Python search example
import requests

def search_entities(query):
    response = requests.get(
        'https://YOUR-SITE.netlify.app/api/search',
        params={'q': query}
    )
    return response.json()['results']

# Usage
results = search_entities('gazprom')
for entity in results:
    print(f"{entity['name']} ({entity['type']}) - Score: {entity['score']}")
```

### Advanced Search with Limits

Control the number of results returned:

```bash
# Get top 5 results
curl "https://YOUR-SITE.netlify.app/api/search?q=putin&limit=5"
```

```javascript
// Get top 10 results
async function searchWithLimit(query, limit = 10) {
  const params = new URLSearchParams({
    q: query,
    limit: Math.min(limit, 50) // Max 50 results
  });
  
  const response = await fetch(
    `https://YOUR-SITE.netlify.app/api/search?${params}`
  );
  return response.json();
}

const results = await searchWithLimit('putin', 10);
console.log(`Found ${results.total} matches, showing ${results.results.length}`);
```

```python
# Python with limit
def search_with_limit(query, limit=10):
    response = requests.get(
        'https://YOUR-SITE.netlify.app/api/search',
        params={
            'q': query,
            'limit': min(limit, 50)  # Max 50 results
        }
    )
    return response.json()

results = search_with_limit('putin', 10)
print(f"Found {results['total']} matches")
```

### Handling Search Results

Process search results and filter by entity type:

```javascript
// Filter results by type
async function searchByType(query, entityType) {
  const response = await fetch(
    `https://YOUR-SITE.netlify.app/api/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  
  return data.results.filter(entity => entity.type === entityType);
}

// Get only individuals
const individuals = await searchByType('putin', 'Individual');

// Get only entities (companies, organizations)
const companies = await searchByType('gazprom', 'Entity');
```

```python
# Filter by entity type
def search_by_type(query, entity_type):
    response = requests.get(
        'https://YOUR-SITE.netlify.app/api/search',
        params={'q': query}
    )
    data = response.json()
    
    return [
        entity for entity in data['results']
        if entity['type'] == entity_type
    ]

# Usage
individuals = search_by_type('putin', 'Individual')
companies = search_by_type('gazprom', 'Entity')
```

---

## Retrieving Entity Details

### Get Full Entity Information

Once you have an entity UID from search results, retrieve complete details:

```bash
curl "https://YOUR-SITE.netlify.app/api/entity/12345"
```

```javascript
// Get entity details
async function getEntityDetails(uid) {
  const response = await fetch(
    `https://YOUR-SITE.netlify.app/api/entity/${uid}`
  );
  
  if (!response.ok) {
    throw new Error(`Entity not found: ${uid}`);
  }
  
  return response.json();
}

// Usage
try {
  const entity = await getEntityDetails('12345');
  console.log(`Name: ${entity.name}`);
  console.log(`Type: ${entity.type}`);
  console.log(`Aliases: ${entity.aliases.join(', ')}`);
  console.log(`Date of Birth: ${entity.dateOfBirth}`);
  console.log(`Place of Birth: ${entity.placeOfBirth}`);
  
  // Display addresses
  entity.addresses.forEach(addr => {
    console.log(`Address: ${addr.address}, ${addr.city}, ${addr.country}`);
  });
} catch (error) {
  console.error(error.message);
}
```

```python
# Get entity details
def get_entity_details(uid):
    response = requests.get(
        f'https://YOUR-SITE.netlify.app/api/entity/{uid}'
    )
    
    if response.status_code == 404:
        raise ValueError(f'Entity not found: {uid}')
    
    return response.json()

# Usage
try:
    entity = get_entity_details('12345')
    print(f"Name: {entity['name']}")
    print(f"Type: {entity['type']}")
    print(f"Aliases: {', '.join(entity['aliases'])}")
    print(f"Date of Birth: {entity.get('dateOfBirth')}")
    print(f"Place of Birth: {entity.get('placeOfBirth')}")
    
    # Display addresses
    for addr in entity['addresses']:
        print(f"Address: {addr['address']}, {addr['city']}, {addr['country']}")
except ValueError as e:
    print(f"Error: {e}")
```

### Complete Search-to-Details Workflow

Combine search and entity retrieval for a complete workflow:

```javascript
// Complete compliance check workflow
async function complianceCheck(name) {
  // Step 1: Search for the entity
  const searchResponse = await fetch(
    `https://YOUR-SITE.netlify.app/api/search?q=${encodeURIComponent(name)}`
  );
  const searchData = await searchResponse.json();
  
  if (searchData.results.length === 0) {
    return { status: 'clear', message: 'No matches found' };
  }
  
  // Step 2: Get details for top match
  const topMatch = searchData.results[0];
  const entityResponse = await fetch(
    `https://YOUR-SITE.netlify.app/api/entity/${topMatch.uid}`
  );
  const entityData = await entityResponse.json();
  
  return {
    status: 'match_found',
    confidence: topMatch.score,
    entity: entityData
  };
}

// Usage
const result = await complianceCheck('Vladimir Putin');
if (result.status === 'match_found') {
  console.log(`⚠️ Match found with ${(result.confidence * 100).toFixed(1)}% confidence`);
  console.log(`Entity: ${result.entity.name}`);
} else {
  console.log('✓ No matches found - entity is clear');
}
```

```python
# Complete compliance check workflow
def compliance_check(name):
    # Step 1: Search for the entity
    search_response = requests.get(
        'https://YOUR-SITE.netlify.app/api/search',
        params={'q': name}
    )
    search_data = search_response.json()
    
    if not search_data['results']:
        return {'status': 'clear', 'message': 'No matches found'}
    
    # Step 2: Get details for top match
    top_match = search_data['results'][0]
    entity_response = requests.get(
        f"https://YOUR-SITE.netlify.app/api/entity/{top_match['uid']}"
    )
    entity_data = entity_response.json()
    
    return {
        'status': 'match_found',
        'confidence': top_match['score'],
        'entity': entity_data
    }

# Usage
result = compliance_check('Vladimir Putin')
if result['status'] == 'match_found':
    print(f"⚠️ Match found with {result['confidence']*100:.1f}% confidence")
    print(f"Entity: {result['entity']['name']}")
else:
    print("✓ No matches found - entity is clear")
```

---

## Checking Dataset Metadata

### Get Dataset Information

Check when the OFAC data was last updated and how many entities are in the database:

```bash
curl "https://YOUR-SITE.netlify.app/api/meta"
```

```javascript
// Get metadata
async function getMetadata() {
  const response = await fetch('https://YOUR-SITE.netlify.app/api/meta');
  return response.json();
}

// Usage
const meta = await getMetadata();
console.log(`Last Updated: ${new Date(meta.lastUpdated).toLocaleString()}`);
console.log(`Total Entities: ${meta.recordCount.toLocaleString()}`);
console.log(`API Version: ${meta.version}`);
```

```python
# Get metadata
def get_metadata():
    response = requests.get('https://YOUR-SITE.netlify.app/api/meta')
    return response.json()

# Usage
meta = get_metadata()
print(f"Last Updated: {meta['lastUpdated']}")
print(f"Total Entities: {meta['recordCount']:,}")
print(f"API Version: {meta['version']}")
```

### Check Data Freshness

Implement a data freshness check in your application:

```javascript
// Check if data is fresh (updated within last 24 hours)
async function isDataFresh() {
  const meta = await getMetadata();
  const lastUpdate = new Date(meta.lastUpdated);
  const now = new Date();
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
  
  return hoursSinceUpdate < 24;
}

// Usage
if (await isDataFresh()) {
  console.log('✓ Data is current');
} else {
  console.log('⚠️ Data may be outdated');
}
```

```python
# Check if data is fresh
from datetime import datetime, timedelta

def is_data_fresh():
    meta = get_metadata()
    last_update = datetime.fromisoformat(meta['lastUpdated'].replace('Z', '+00:00'))
    now = datetime.now(last_update.tzinfo)
    hours_since_update = (now - last_update).total_seconds() / 3600
    
    return hours_since_update < 24

# Usage
if is_data_fresh():
    print('✓ Data is current')
else:
    print('⚠️ Data may be outdated')
```

---

## Rate Limiting and Best Practices

### Understanding Rate Limits

The OFAC API is designed for high throughput. Current limits:

- **Search Requests**: 100 requests per minute per IP
- **Entity Requests**: 100 requests per minute per IP
- **Metadata Requests**: 1000 requests per minute per IP

### Implementing Rate Limit Handling

Handle rate limit responses gracefully:

```javascript
// Retry with exponential backoff
async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url);
    
    if (response.status === 429) {
      // Rate limited - wait and retry
      const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
      console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  throw new Error('Max retries exceeded');
}

// Usage
const data = await fetchWithRetry('https://YOUR-SITE.netlify.app/api/search?q=putin');
```

```python
# Retry with exponential backoff
import time

def fetch_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url)
        
        if response.status_code == 429:
            # Rate limited - wait and retry
            wait_time = 2 ** attempt  # Exponential backoff in seconds
            print(f"Rate limited. Waiting {wait_time}s before retry...")
            time.sleep(wait_time)
            continue
        
        response.raise_for_status()
        return response.json()
    
    raise Exception('Max retries exceeded')

# Usage
data = fetch_with_retry('https://YOUR-SITE.netlify.app/api/search?q=putin')
```

### Caching Strategies

Reduce API calls by implementing intelligent caching:

```javascript
// Simple in-memory cache with TTL
class APICache {
  constructor(ttlMinutes = 60) {
    this.cache = new Map();
    this.ttlMs = ttlMinutes * 60 * 1000;
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}

// Usage
const cache = new APICache(60); // 60 minute TTL

async function searchWithCache(query) {
  const cacheKey = `search:${query}`;
  
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Cache hit');
    return cached;
  }
  
  // Fetch from API
  const response = await fetch(
    `https://YOUR-SITE.netlify.app/api/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  
  // Store in cache
  cache.set(cacheKey, data);
  return data;
}
```

```python
# Simple cache with TTL
from datetime import datetime, timedelta

class APICache:
    def __init__(self, ttl_minutes=60):
        self.cache = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def get(self, key):
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        if datetime.now() - entry['timestamp'] > self.ttl:
            del self.cache[key]
            return None
        
        return entry['value']
    
    def set(self, key, value):
        self.cache[key] = {
            'value': value,
            'timestamp': datetime.now()
        }

# Usage
cache = APICache(ttl_minutes=60)

def search_with_cache(query):
    cache_key = f'search:{query}'
    
    # Check cache first
    cached = cache.get(cache_key)
    if cached:
        print('Cache hit')
        return cached
    
    # Fetch from API
    response = requests.get(
        'https://YOUR-SITE.netlify.app/api/search',
        params={'q': query}
    )
    data = response.json()
    
    # Store in cache
    cache.set(cache_key, data)
    return data
```

### Performance Best Practices

1. **Batch Operations**: Group multiple searches when possible
2. **Use Appropriate Limits**: Request only the results you need
3. **Cache Aggressively**: OFAC data changes infrequently
4. **Monitor Metadata**: Check update frequency to optimize refresh timing
5. **Implement Timeouts**: Set reasonable request timeouts (5-10 seconds)

---

## Troubleshooting

### Common Issues and Solutions

#### "Missing required parameter: q"

**Problem**: Search request without a query parameter

**Solution**: Always include the `q` parameter:

```bash
# ❌ Wrong
curl "https://YOUR-SITE.netlify.app/api/search"

# ✅ Correct
curl "https://YOUR-SITE.netlify.app/api/search?q=putin"
```

#### "Entity not found"

**Problem**: Requesting an entity with an invalid UID

**Solution**: Verify the UID from a search result first:

```javascript
// ❌ Wrong - guessing UIDs
const entity = await getEntityDetails('invalid-uid');

// ✅ Correct - get UID from search
const searchResults = await searchEntities('putin');
const uid = searchResults[0].uid;
const entity = await getEntityDetails(uid);
```

#### "Rate limit exceeded"

**Problem**: Too many requests in a short time

**Solution**: Implement exponential backoff and caching (see Rate Limiting section above)

#### "No results found"

**Problem**: Search returns empty results

**Solution**: Try alternative search terms or check spelling:

```javascript
// Try multiple search strategies
async function flexibleSearch(name) {
  // Try exact name
  let results = await searchEntities(name);
  if (results.length > 0) return results;
  
  // Try first name only
  const firstName = name.split(' ')[0];
  results = await searchEntities(firstName);
  if (results.length > 0) return results;
  
  // Try last name only
  const lastName = name.split(' ').pop();
  results = await searchEntities(lastName);
  
  return results;
}
```

#### "Connection timeout"

**Problem**: Request takes too long to complete

**Solution**: Check your network connection and implement timeouts:

```javascript
// Fetch with timeout
async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
```

```python
# Requests with timeout
def fetch_with_timeout(url, timeout=10):
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        print("Request timed out")
        raise
```

### Getting Help

If you encounter issues not covered here:

1. Check the API Documentation for endpoint details
2. Review the error response for specific error codes
3. Verify your request format matches the examples
4. Check your network connectivity
5. Contact devs.miami for support

---

## Next Steps

- **Explore the API**: Visit the interactive API documentation
- **View Examples**: Check out the code examples in your preferred language
- **Learn More**: Read about the project on the About page
- **Get Involved**: Contribute on GitHub

---

Built with ❤️ by devs.miami
