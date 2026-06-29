# OFAC Sanctions API Demo

A TypeScript serverless API that exposes U.S. Treasury OFAC SDN data through a documented OpenAPI interface with Swagger UI, ReDoc, fuzzy search, entity lookup, metadata, scheduled data refresh, and refresh-delta metadata.

Built as the compliance data layer for a larger financial intelligence prototype.

```txt
GET /api/search?q=maduro
GET /api/entity/{uid}
GET /api/meta
```

[Try in Swagger UI](/swagger-ui.html) · [Read ReDoc](/docs.html) · [View GitHub](https://github.com/melroser/sdn-openapi) · [Read the finance case study](https://devs.miami/finance)

---

## What this demonstrates

### TypeScript API design

The API is implemented with Netlify Functions and a small, explicit REST surface for search, entity lookup, metadata, and controlled dataset refresh. It demonstrates a practical Serverless architecture for public compliance data.

### OpenAPI documentation

The project includes an OpenAPI specification, Swagger UI, ReDoc, and practical cURL, JavaScript, and Python examples.

### Compliance data integration

The data pipeline fetches OFAC Sanctions List Service CSV exports, parses SDN, alternate-name, and address files, and stores a compressed searchable dataset in Netlify Blobs.

### Fuzzy search

Fuse.js powers approximate matching across entity names and aliases, which is useful for real screening workflows where names are often incomplete or spelled differently.

### Production-style API patterns

The project demonstrates validation, structured JSON responses, cache headers, CORS handling, scheduled refresh design, update-secret authentication, and delta summaries between refreshes.

---

## Financial intelligence context

This API began as the compliance data layer for a broader financial intelligence prototype: combine sanctions data, country-level signals, world news, AI-assisted sentiment analysis, and uncertainty modeling into a workflow for geopolitical risk research.

The companion concept is **ED 209**, a Python FastAPI prototype that explores uncertainty-aware sanctions screening with Subjective Logic. Instead of treating a fuzzy match as a crude yes/no answer, the risk engine can explain which evidence is strong, which evidence is missing, and whether the next action should be clear, escalate, block, or gather more information.

- **ED 209 source:** https://github.com/melroser/ed-209
- **Combined case study:** https://devs.miami/finance

---

## Quick Start

Search for an entity:

```bash
curl "https://sdn-openapi.netlify.app/api/search?q=Maduro&limit=5"
```

Example response shape:

```json
{
  "ok": true,
  "q": "Maduro",
  "count": 2,
  "results": [
    {
      "uid": "22790",
      "name": "MADURO MOROS, Nicolas",
      "type": "individual",
      "score": 0.06,
      "programs": ["VENEZUELA"]
    }
  ]
}
```

Check dataset metadata:

```bash
curl "https://sdn-openapi.netlify.app/api/meta"
```

---

## Data Provenance and Freshness

All source data comes from the **U.S. Treasury Office of Foreign Assets Control (OFAC)** Sanctions List Service exports.

**Official OFAC source:** [OFAC SDN Human-Readable Lists](https://home.treasury.gov/policy-guidance/financial-sanctions-and-embargoes/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists)

- **Automatic refresh:** scheduled Netlify Function
- **Manual refresh:** `POST /api/update`, protected by a configured update secret
- **Source files:** SDN, ALT, and ADD CSV exports
- **Verification:** `/api/meta` exposes source URLs, row counts, SHA-256 hashes, and the latest refresh delta summary

---

## API endpoints

### `GET /api/search?q=query`

Search OFAC-designated entities by name or alias using fuzzy matching.

### `GET /api/entity/{uid}`

Retrieve the stored entity record for a specific OFAC entity UID.

### `GET /api/meta`

Return dataset metadata, including source URLs, counts, hashes, refresh timestamp, and delta summary.

### `POST /api/update`

Refresh the dataset from OFAC source files. Manual calls require the configured update secret.

---

## Why this matters

Financial and compliance systems often need to reason about messy entity data. Names are misspelled, aliases differ, countries matter, and a fuzzy score alone does not explain whether a match should be blocked, ignored, or escalated.

This project focuses on the API layer: making public sanctions data easy to query, document, verify, and integrate. The larger portfolio concept builds on this layer with uncertainty-aware screening and AI-assisted risk analysis.

---

## Stack

- **API:** TypeScript, Netlify Functions
- **Storage:** Netlify Blobs
- **Search:** Fuse.js
- **Data source:** U.S. Treasury OFAC SLS exports
- **Docs:** OpenAPI, Swagger UI, ReDoc
- **Testing:** Vitest

---

Built by [Robert Melrose](https://devs.miami) as a fintech engineering portfolio project. See the combined [Sanctions Intelligence Demo](https://devs.miami/finance) for the SDN OpenAPI + ED 209 funnel.
