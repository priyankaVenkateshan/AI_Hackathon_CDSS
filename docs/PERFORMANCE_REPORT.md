# Performance Benchmarking Report (Req 6.3)

## Test Results Summary
Date: 2026-03-08
Environment: Local Backend -> SSH Tunnel -> Aurora (ap-south-1)

| Endpoint | Average Latency | Status |
| :--- | :--- | :--- |
| **GET /health** | 2.80s | FAIL (Target < 2s) |
| **GET /api/v1/patients** | 5.78s | FAIL (Target < 2s) |
| **GET /api/v1/patients/PT-1001** | 10.18s | FAIL (Target < 2s) |
| **GET /api/v1/terminology** | 2.56s | FAIL (Target < 2s) |

## Bottleneck Analysis

### 1. SSH Tunnel & Cross-Region Latency (Major)
The current development setup uses an SSM SSH tunnel from a local machine to a bastion host in `ap-south-1`. Every SQL query incurrs multiple round-trips over the public internet, adding ~500ms-1s of overhead per request.
- **Tuning Done**: Ensured connection pooling is active in the backend logic to reduce handshake counts.
- **Production Expectation**: In the deployed AWS Lambda environment (VPC-connected to Aurora), this latency is expected to drop to < 100ms.

### 2. Synchronous Bedrock Summarization (Critical)
The `Patient Detail` endpoint (10.18s) triggers a synchronous call to AWS Bedrock to generate a clinical summary.
- **Bottleneck**: Bedrock LLM generation is inherently slow (5-8 seconds).
- **Tuning Recommendation**: Implement an asynchronous pattern where the UI displays a "Generating..." state while the summary is fetched via a separate WebSocket or polling endpoint.

### 3. I/O Bound Terminology Fetch
The terminology endpoint is relatively slow (2.56s) because it loads large translation files from disk/memory on the first few hits.
- **Production Expectation**: CloudFront or ElastiCache caching will reduce this to sub-50ms.

## Recommendations for CI/CD
Future performance tests should be run from an AWS-resident runner (e.g., CodeBuild) within the same region as the database to get accurate production-like metrics.
