# VRUX API Documentation

## Overview

VRUX provides a REST API for generating React components using AI. All API endpoints are prefixed with `/api`.

## Authentication

Currently, the API uses environment-based API keys for OpenAI. Future versions will support user-based authentication.

## Rate Limiting

- **Default**: 10 requests per minute per IP address
- **Headers**: `X-RateLimit-Remaining` and `X-RateLimit-Reset` are included in responses

## Endpoints

### Generate UI Component

Generate a React component from a natural language description.

**Endpoint**: `POST /api/generate-ui`

**Request Headers**:

```http
Content-Type: application/json
```

**Request Body**:

```json
{
  "prompt": "string (required, max 1000 characters)"
}
```

**Success Response** (200 OK):

```json
{
  "code": "string (generated React component code)",
  "usage": {
    "prompt_tokens": 123,
    "completion_tokens": 456,
    "total_tokens": 579
  },
  "remainingRequests": 9
}
```

**Error Responses**:

- **400 Bad Request**:

  ```json
  {
    "error": "Prompt is required"
  }
  ```

- **429 Too Many Requests**:

  ```json
  {
    "error": "Too many requests. Please try again later.",
    "resetTime": "2024-01-01T00:00:00.000Z",
    "remainingRequests": 0
  }
  ```

- **500 Internal Server Error**:

  ```json
  {
    "error": "Failed to generate UI. Please try again.",
    "requestId": "abc123"
  }
  ```

**Example Request**:

```bash
curl -X POST https://your-domain.com/api/generate-ui \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a modern pricing card with three tiers"}'
```

### Health Check

Check the health status of the API.

**Endpoint**: `GET /api/health`

**Success Response** (200 OK):

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "openai": {
    "configured": true
  },
  "uptime": 3600
}
```

## Response Headers

All API responses include the following headers:

- `X-Request-Id`: Unique identifier for request tracing
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Time when rate limit window resets
- `Cache-Control`: Caching directives

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "requestId": "unique-request-id",
  "details": {} // Additional error context (development only)
}
```

## CORS

The API supports CORS for web applications. Configure allowed origins using the `CORS_ALLOWED_ORIGINS` environment variable.

Default allowed origin: `http://localhost:3000`

## Performance

- Average response time: < 3 seconds
- Maximum response time: 10 seconds (timeout)
- Concurrent request handling: Yes
- Request size limit: 1MB

## Best Practices

1. **Error Handling**: Always check response status codes
2. **Rate Limiting**: Implement exponential backoff for 429 errors
3. **Timeouts**: Set client timeout to 15 seconds
4. **Retries**: Retry failed requests up to 3 times
5. **Caching**: Cache successful responses when appropriate

## SDK Examples

### JavaScript/TypeScript

```typescript
interface GenerateUIRequest {
  prompt: string;
}

interface GenerateUIResponse {
  code: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  remainingRequests?: number;
}

async function generateComponent(prompt: string): Promise<GenerateUIResponse> {
  const response = await fetch('/api/generate-ui', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate component');
  }

  return response.json();
}
```

### Python

```python
import requests
import json

def generate_component(prompt):
    url = "https://your-domain.com/api/generate-ui"
    headers = {"Content-Type": "application/json"}
    data = {"prompt": prompt}
    
    response = requests.post(url, headers=headers, json=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"API Error: {response.json().get('error')}")
```

## Changelog

### v0.1.0 (Current)

- Initial API release
- Component generation endpoint
- Health check endpoint
- Rate limiting (10 req/min)
- Request logging and monitoring
