# ViewComfy Integration Guide

This guide explains how to integrate and use the ViewComfy API in your VRUX web application.

## Overview

ViewComfy is a serverless API that runs ComfyUI workflows to generate images based on text prompts. The integration supports both standard request-response and streaming (Server-Sent Events) modes.

## Setup

### 1. Environment Variables

Add these to your `.env.local` file:

```env
VIEWCOMFY_API_URL=<Your_ViewComfy_endpoint>
VIEWCOMFY_CLIENT_ID=<Your_ViewComfy_client_id>
VIEWCOMFY_CLIENT_SECRET=<Your_ViewComfy_client_secret>
```

### 2. API Endpoints

The integration provides two API endpoints:

- `/api/generate-viewcomfy` - Standard POST endpoint for image generation
- `/api/generate-viewcomfy-stream` - Streaming endpoint with real-time logs

## Usage Examples

### Basic Usage with Component

```tsx
import ViewComfyGenerator from '../components/viewcomfy-generator'

function MyComponent() {
  const handleGenerated = (outputs) => {
    console.log('Generated images:', outputs)
  }

  return (
    <ViewComfyGenerator 
      onGenerate={handleGenerated}
      className="max-w-2xl"
    />
  )
}
```

### Using the Hook

```tsx
import { useViewComfy } from '../lib/hooks/use-viewcomfy'

function MyComponent() {
  const {
    generate,
    generateWithStreaming,
    isGenerating,
    error,
    outputs,
    logs,
    executionTime
  } = useViewComfy({
    onSuccess: (outputs) => {
      console.log('Success!', outputs)
    }
  })

  const handleGenerate = async () => {
    // Basic generation
    await generate('A modern dashboard UI with dark theme')
    
    // Or with custom parameters
    await generate('A colorful landing page', {
      '3-inputs-seed': 12345,
      '3-inputs-steps': 30
    })
  }

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        Generate
      </button>
      
      {outputs.map((output, i) => (
        <img 
          key={i}
          src={`data:${output.content_type};base64,${output.data}`}
          alt="Generated UI"
        />
      ))}
    </div>
  )
}
```

### Direct API Call

```tsx
async function generateUI(prompt: string) {
  const response = await fetch('/api/generate-viewcomfy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: prompt,
      useStreaming: false
    }),
  })

  const data = await response.json()
  
  if (data.success) {
    return data.outputs
  } else {
    throw new Error(data.error)
  }
}
```

### Streaming with Real-time Logs

```tsx
async function generateWithLogs(prompt: string) {
  const response = await fetch('/api/generate-viewcomfy-stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    // Process Server-Sent Events
    console.log(chunk)
  }
}
```

## Working with Workflow Parameters

### Using the Parameter Creator

```tsx
import { createWorkflowParameters } from '../lib/viewcomfy-utils'

// Load your workflow JSON
const workflow = require('./workflow_api.json')

// Create flattened parameters
const params = createWorkflowParameters(workflow)

// Modify specific parameters
params['6-inputs-text'] = 'My custom prompt'
params['3-inputs-seed'] = 42

// Use with the API
await generate('UI prompt', params)
```

### Pre-built Parameter Helpers

```tsx
import { 
  createTextToImageParams,
  createImageToImageParams,
  createUIGenerationParams 
} from '../lib/viewcomfy-utils'

// Text to Image
const params1 = createTextToImageParams(
  'A beautiful sunset',
  'blurry, low quality', // negative prompt
  12345 // seed
)

// Image to Image
const params2 = createImageToImageParams(
  'Transform to cyberpunk style',
  imageFile, // File or Blob
  0.75, // strength
  12345 // seed
)

// UI Generation specific
const params3 = createUIGenerationParams(
  'Modern dashboard',
  'dark', // style: 'modern' | 'minimal' | 'colorful' | 'dark'
  12345 // seed
)
```

## Handling Outputs

### Display Images

```tsx
{outputs.map((output, index) => (
  <img
    key={index}
    src={`data:${output.content_type};base64,${output.data}`}
    alt={`Generated ${index}`}
  />
))}
```

### Download Images

```tsx
function downloadImage(output: ViewComfyFileOutput) {
  // Convert base64 to blob
  const byteCharacters = atob(output.data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: output.content_type })

  // Create download link
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = output.filename
  a.click()
  URL.revokeObjectURL(url)
}
```

## Important Notes

1. **Cold Starts**: The first request may take longer due to cold starts. Inform users about this.

2. **Generation Times**: Vary based on workflow complexity. Simple workflows may take 2-10 seconds, complex ones can take minutes.

3. **Parameters**: The params object cannot be empty. Always include at least a seed value if no other parameters are specified.

4. **File Uploads**: When uploading images, use File or Blob objects in the parameters.

5. **Error Handling**: Always implement proper error handling for network issues and API errors.

## Demo Page

Visit `/viewcomfy-demo` to see a full working example with both basic and streaming implementations.

## TypeScript Types

```tsx
interface ViewComfyFileOutput {
  filename: string
  content_type: string
  data: string // base64 encoded
  size: number
}

interface ViewComfyGenerateRequest {
  prompt: string
  workflowParams?: Record<string, any>
  useStreaming?: boolean
}

interface ViewComfyGenerateResponse {
  success: boolean
  promptId?: string
  outputs?: ViewComfyFileOutput[]
  error?: string
  executionTime?: number
}
```