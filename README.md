# OFAC SDN JSON Wrapper API

A modern, serverless API providing developer-friendly access to U.S. Treasury sanctions data. This proof-of-concept demonstrates how to build scalable, real-time data services using contemporary cloud architecture.

## Table of Contents

- [Overview](#overview)
- [Purpose & Motivation](#purpose--motivation)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Setup & Installation](#setup--installation)
- [API Endpoints](#api-endpoints)
- [Data Source & Freshness](#data-source--freshness)
- [Contributing](#contributing)
- [License](#license)
- [About devs.miami](#about-devsmiamicom)

## Overview

The OFAC SDN JSON Wrapper API provides programmatic access to the U.S. Treasury's Office of Foreign Assets Control (OFAC) Specially Designated Nationals (SDN) list. Instead of parsing complex XML exports, developers can use a clean, modern JSON API with fuzzy search, entity retrieval, and metadata endpoints.

**Key Features:**
- **Fuzzy Search**: Find entities by name or alias with intelligent matching
- **Entity Details**: Retrieve comprehensive information including aliases, addresses, and dates of birth
- **Real-time Data**: Automatic dataset updates with manual refresh capability
- **Serverless Architecture**: Scales automatically with zero infrastructure management
- **Developer-Friendly**: RESTful API with clear documentation and code examples

## Purpose & Motivation

This project emerged from real-world experience integrating OFAC compliance checks into production systems. The challenge: OFAC publishes data in XML format that requires complex parsing, and compliance requirements demand fresh data with minimal latency.

The solution: A serverless API that automatically fetches, parses, and indexes OFAC data, making it instantly accessible to any application. This proof-of-concept demonstrates:

- **Modern Architecture**: Serverless functions eliminate infrastructure overhead
- **Efficient Data Handling**: Compressed storage and in-memory caching for sub-100ms responses
- **Scalability**: Handles thousands of concurrent requests without provisioning
- **Developer Experience**: Clean API design with comprehensive documentation

Built by [devs.miami](#about-devsmiamicom), this project showcases the technical approach we bring to complex integration challenges.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OFAC API System                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Data Source                                                 │
│  └─ OFAC SLS XML Exports (Treasury.gov)                      │
│                                                               │
│  Data Pipeline                                               │
│  ├─ ofac-update: Fetch & parse OFAC XML                      │
│  ├─ CSV parsing with entity normalization                    │
│  ├─ Compression (gzip) for efficient storage                 │
│  └─ Netlify Blobs: Persistent, distributed storage           │
│                                                               │
│  API Layer (Netlify Functions)                               │
│  ├─ ofac-search: Fuzzy search with Fuse.js                   │
│  ├─ ofac-entity: Entity detail retrieval                     │
│  ├─ ofac-meta: Dataset metadata                              │
│  └─ ofac-update: Manual refresh trigger                      │
│                                                               │
│  Client Applications                                         │
│  └─ Any HTTP client (web, mobile, backend)                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Serverless Functions**: Netlify Functions provide automatic scaling and zero infrastructure management. Each endpoint is independently deployable and scales based on demand.

**Distributed Storage**: Netlify Blobs provides globally distributed, persistent storage for the OFAC dataset. Data is replicated across regions for low-latency access.

**In-Memory Caching**: Each function instance caches the decompressed dataset for 10 minutes, reducing storage I/O and improving response times.

**Fuzzy Matching**: Fuse.js provides intelligent search with configurable thresholds, handling typos and variations in entity names.

**Compression**: OFAC data is stored as gzip-compressed JSON, reducing storage costs and transfer times while maintaining fast decompression.

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js (TypeScript) | Type-safe serverless functions |
| **Hosting** | Netlify Functions | Serverless compute platform |
| **Storage** | Netlify Blobs | Distributed data storage |
| **Search** | Fuse.js | Fuzzy matching and ranking |
| **Parsing** | csv-parse | OFAC CSV data parsing |
| **Compression** | zlib | Dataset compression |
| **Testing** | Vitest + fast-check | Unit and property-based testing |
| **Documentation** | Marked.js + Highlight.js | Markdown-to-HTML with syntax highlighting |

### Dependencies

**Production:**
- `@netlify/functions` - Netlify serverless runtime
- `@netlify/blobs` - Distributed blob storage
- `fuse.js` - Fuzzy search library
- `csv-parse` - CSV parsing
- `marked` - Markdown parsing
- `highlight.js` - Syntax highlighting

**Development:**
- `vitest` - Unit testing framework
- `fast-check` - Property-based testing
- `@types/node` - TypeScript definitions

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Git
- Netlify account (for deployment)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devs-miami/ofac-api.git
   cd ofac-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build documentation:**
   ```bash
   npm run build:docs
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Deploy to Netlify:**
   ```bash
   netlify deploy
   ```

### Environment Setup

The API uses Netlify Blobs for storage. When deployed to Netlify, blobs are automatically available. For local development, you can test with mock data.

### Initial Data Load

The first time the API runs, it will attempt to fetch the OFAC dataset. You can trigger this manually:

```bash
curl -X POST https://your-site.netlify.app/api/update
```

Or wait for the scheduled update (configured in `netlify.toml`).

## API Endpoints

### Search Entities

**Endpoint:** `GET /api/search`

Search for entities in the OFAC sanctions list using fuzzy matching.

**Parameters:**
- `q` (required): Search query string (name or alias)
- `limit` (optional): Maximum results to return (default: 20, max: 50)

**Example:**
```bash
curl "https://your-site.netlify.app/api/search?q=Vladimir&limit=10"
```

**Response:**
```json
{
  "ok": true,
  "q": "Vladimir",
  "count": 2,
  "results": [
    {
      "uid": "12345",
      "name": "Vladimir Putin",
      "type": "Individual",
      "score": 0.98,
      "programs": ["UKRAINE-EO14066"]
    },
    {
      "uid": "12346",
      "name": "Vladimir Sokolov",
      "type": "Individual",
      "score": 0.85,
      "programs": ["UKRAINE-EO14066"]
    }
  ]
}
```

### Get Entity Details

**Endpoint:** `GET /api/entity/{uid}`

Retrieve complete details for a specific entity.

**Parameters:**
- `uid` (required): Entity unique identifier

**Example:**
```bash
curl "https://your-site.netlify.app/api/entity/12345"
```

**Response:**
```json
{
  "uid": "12345",
  "name": "Vladimir Putin",
  "type": "Individual",
  "aliases": [
    "Wladimir Putin",
    "Vladimir Vladimirovich Putin"
  ],
  "addresses": [
    {
      "address": "Kremlin",
      "city": "Moscow",
      "country": "Russia"
    }
  ],
  "dateOfBirth": "1952-10-01",
  "placeOfBirth": "Leningrad",
  "programs": ["UKRAINE-EO14066"]
}
```

### Get Dataset Metadata

**Endpoint:** `GET /api/meta`

Retrieve information about the current dataset.

**Example:**
```bash
curl "https://your-site.netlify.app/api/meta"
```

**Response:**
```json
{
  "lastUpdated": "2024-01-13T00:00:00Z",
  "recordCount": 12345,
  "version": "1.0.0"
}
```

### Trigger Manual Update

**Endpoint:** `POST /api/update`

Manually trigger a refresh of the OFAC dataset.

**Example:**
```bash
curl -X POST "https://your-site.netlify.app/api/update"
```

**Response:**
```json
{
  "status": "success",
  "message": "Dataset refresh initiated"
}
```

## Data Source & Freshness

### Data Source

The OFAC SDN list is sourced directly from the U.S. Treasury Department's Office of Foreign Assets Control:
- **Official Source**: https://home.treasury.gov/policy-issues/financial-sanctions-and-embargoes/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists
- **Format**: CSV exports from OFAC SLS (Sanctions List Service)
- **Coverage**: Specially Designated Nationals, Blocked Persons, and related entities

### Data Freshness

- **Automatic Updates**: The dataset is refreshed daily via scheduled Netlify Functions
- **Manual Refresh**: Use the `/api/update` endpoint to trigger immediate updates
- **Last Updated**: Check the `/api/meta` endpoint for the exact timestamp of the current dataset
- **Latency**: Updates are typically available within 1-2 hours of OFAC publication

### Data Accuracy

This is an unofficial wrapper. While we strive for accuracy, always verify critical compliance decisions against the official OFAC sources. The API is provided as-is for informational purposes.

## Contributing

We welcome contributions! Here's how to get involved:

### Development Workflow

1. **Fork the repository** on GitHub
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** and add tests
4. **Run tests**: `npm test`
5. **Commit with clear messages**: `git commit -am 'Add feature description'`
6. **Push to your fork**: `git push origin feature/your-feature`
7. **Open a Pull Request** with a clear description

### Code Standards

- **TypeScript**: All code must be type-safe
- **Testing**: New features must include tests (unit + property-based)
- **Documentation**: Update README and API docs for user-facing changes
- **Formatting**: Follow existing code style

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test -- netlify/tests/ofac-search.test.ts
```

### Reporting Issues

Found a bug? Please open an issue on GitHub with:
- Clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Your environment (Node version, OS, etc.)

## License

This project is licensed under the MIT License. See the LICENSE file for details.

**MIT License Summary:**
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute
- ✅ Use privately
- ⚠️ Include license and copyright notice
- ❌ Hold liable

## About devs.miami

**devs.miami** is a software engineering company founded by Robert Melrose, focused on building innovative solutions for complex technical challenges.

### Our Approach

We believe in:
- **Clean Architecture**: Well-designed systems that scale
- **Developer Experience**: APIs and tools that are a joy to use
- **Real-World Solutions**: Proof-of-concepts that solve actual problems
- **Modern Technology**: Leveraging the best tools and practices
- **Continuous Learning**: Staying current with evolving technologies

### Robert Melrose

Robert is a software engineer with deep expertise in:
- Serverless architecture and cloud-native applications
- API design and integration
- Data systems and real-time processing
- Full-stack development (frontend, backend, infrastructure)

With years of experience building production systems, Robert brings practical knowledge of what works at scale.

### Get in Touch

- **Website**: https://devs.miami
- **GitHub**: https://github.com/devs-miami
- **Email**: hello@devs.miami

---

**Built with ❤️ by devs.miami**
