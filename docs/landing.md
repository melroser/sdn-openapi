# OFAC API: Serverless Sanctions Data Access

## Hero Section

Welcome to the OFAC API—a modern, serverless proof-of-concept for accessing U.S. Treasury sanctions data in real-time. Built with cutting-edge cloud technology, this project demonstrates how to efficiently query and integrate OFAC compliance data into your applications.

**Explore the power of serverless architecture combined with critical compliance data.**

---

## Key Features

### ⚡ Serverless Architecture
Built on Netlify Functions for instant scalability, zero infrastructure management, and pay-per-use pricing. Deploy once, scale infinitely.

### 🔍 Fuzzy Search
Powerful full-text search with fuzzy matching to find entities even with partial or misspelled names. Get results in milliseconds.

### 📊 Real-Time Data
Automatically updated OFAC sanctions list. Stay compliant with the latest designations and removals from the U.S. Treasury.

### 🛡️ Production-Ready
Comprehensive error handling, rate limiting, and security best practices built in from day one.

### 📚 Complete Documentation
Interactive API documentation, usage guides, and code examples in JavaScript, Python, and cURL.

### 🚀 Easy Integration
RESTful API with simple, intuitive endpoints. Integrate in minutes, not days.

---

## About devs.miami

**devs.miami** is a software engineering company founded by **Robert Melrose**, focused on building innovative solutions that solve real-world problems. We specialize in:

- **Cloud Architecture**: Designing scalable, serverless systems
- **API Development**: Building robust, well-documented APIs
- **Full-Stack Solutions**: From backend to frontend, we deliver complete systems
- **Proof of Concepts**: Demonstrating technical feasibility and best practices

### Robert Melrose

Robert Melrose is a software engineer and founder with extensive experience in cloud architecture, API design, and full-stack development. His work demonstrates a commitment to clean code, best practices, and solving complex technical challenges with elegant solutions.

**Expertise:**
- Serverless Architecture (AWS Lambda, Netlify Functions)
- API Design and Development
- Full-Stack JavaScript/TypeScript
- Cloud Infrastructure and DevOps
- Real-time Data Processing

---

## Data Provenance & Freshness

### Data Source

All data comes from the **U.S. Treasury Office of Foreign Assets Control (OFAC)** Specially Designated Nationals (SDN) List.

**Official OFAC Source:** [OFAC SDN Human-Readable Lists](https://home.treasury.gov/policy-guidance/financial-sanctions-and-embargoes/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists)

### Update Frequency

- **Automatic Updates**: Daily at 2 AM UTC
- **Manual Updates**: Available on-demand via the `/api/update` endpoint
- **Update Mechanism**: Scheduled Netlify Functions automatically fetch the latest OFAC data and store it in Netlify Blobs

### Data Freshness

- **Typical Freshness**: Within 24 hours of OFAC updates
- **OFAC Publication Schedule**: Updates published on business days
- **Processing Delay**: Approximately 1-2 hours after OFAC publication
- **Check Last Update**: Use the `/api/meta` endpoint to retrieve the `lastUpdated` timestamp

### Metadata Endpoint

Get information about the current dataset:

```
GET /api/meta
```

Response includes:
- `lastUpdated`: ISO 8601 timestamp of the last data refresh
- `recordCount`: Total number of entities in the dataset
- `version`: API version

### Manual Update Trigger

Trigger a manual data refresh:

```
POST /api/update
```

Optional request body:
```json
{
  "secret": "YOUR_SECRET"
}
```

---

## Quick Start

Get started in 30 seconds with a working example:

### Search for an Entity

**cURL:**
```bash
curl "https://YOUR-SITE.netlify.app/api/search?q=Maduro&limit=5"
```

**JavaScript:**
```javascript
const response = await fetch('/api/search?q=Maduro&limit=5');
const data = await response.json();
console.log(data.results);
```

**Expected Response:**
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

### Next Steps

- **Explore the API** - Visit our [API Documentation](/docs.html) to see all available endpoints and try them out interactively
- **Read the Usage Guide** - Check out the [Usage Guide](/usage-guide.html) for more code examples and common use cases
- **Integrate** - Use the provided code examples to integrate OFAC data into your application

---

## API Endpoints

### Search Entities
GET /api/search?q=query

Search for OFAC-designated entities by name with fuzzy matching.

### Get Entity Details
GET /api/entity/{uid}

Retrieve complete details for a specific entity.

### Check Metadata
GET /api/meta

Get information about the dataset, including last update time and record count.

### Trigger Update
POST /api/update

Manually trigger a refresh of the OFAC data (admin only).

---

## Why This Project?

This proof-of-concept was born from real-world experience with compliance requirements. Many organizations struggle with:

- **Outdated Data**: Manual updates that fall out of sync
- **Complex Integration**: Difficult APIs and poor documentation
- **Scalability Issues**: Systems that can't handle traffic spikes
- **High Costs**: Expensive infrastructure for simple queries

The OFAC API solves these problems with a modern, serverless approach that's:
- **Always Current**: Automatically updated
- **Easy to Use**: Simple, well-documented API
- **Infinitely Scalable**: Handles any traffic volume
- **Cost-Effective**: Pay only for what you use

---

## Technical Highlights

### Serverless Architecture
Built entirely on Netlify Functions, eliminating the need for server management. Functions scale automatically and you only pay for execution time.

### Efficient Data Storage
OFAC data is stored in Netlify Blobs for fast, reliable access. The system automatically handles data compression and retrieval.

### Fuzzy Search
Powered by Fuse.js, the search engine provides intelligent matching even with typos and partial names.

### Real-Time Updates
Scheduled functions automatically fetch the latest OFAC data from the U.S. Treasury, ensuring your data is always current.

### Production-Ready Error Handling
Comprehensive error handling, validation, and logging ensure reliability in production environments.

---

## Use Cases

### Compliance Screening
Automatically screen customers, vendors, and counterparties against OFAC sanctions lists.

### Risk Management
Integrate OFAC data into your risk management systems for real-time compliance monitoring.

### Due Diligence
Streamline your due diligence process with fast, accurate OFAC searches.

### Regulatory Reporting
Use the API to gather data for regulatory compliance reports and audits.

---

## Get Involved

### Explore the Code
The entire project is open source. Check out the GitHub repository to see how it's built.

### Learn More
Visit devs.miami to learn about our other projects and services.

### Contact Us
Interested in consulting, custom development, or discussing your compliance challenges? Get in touch.

---

## Technology Stack

- **Runtime**: Node.js
- **Hosting**: Netlify Functions
- **Data Storage**: Netlify Blobs
- **Search**: Fuse.js
- **API Documentation**: OpenAPI/Swagger
- **Frontend**: Static HTML/CSS
- **Version Control**: Git/GitHub

---

## License

This project is provided as a proof-of-concept demonstration. See the repository for license details.

---

## Next Steps

Ready to get started? Choose your next step:

- **Explore the API** - Interactive API documentation
- **Read the Usage Guide** - Code examples and tutorials
- **Learn More About Us** - Our story and approach
- **View on GitHub** - Source code and contributions

---

Built with love by devs.miami
