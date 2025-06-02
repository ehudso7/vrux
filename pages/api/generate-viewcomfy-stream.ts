import type { NextApiRequest, NextApiResponse } from 'next'
import { ViewComfyClient } from '../../lib/viewcomfy-client'
import rateLimiter from '../../lib/rate-limiter'
import cors, { runMiddleware } from '../../lib/cors'
import logger from '../../lib/logger'
import { createUIGenerationParams } from '../../lib/viewcomfy-utils'
import type { ViewComfyGenerateRequest } from '../../lib/types'

// Extend NextApiRequest to include custom properties
interface ExtendedNextApiRequest extends NextApiRequest {
	id?: string
}

// ViewComfy configuration from environment variables
const viewComfyConfig = {
	inferUrl: process.env.VIEWCOMFY_API_URL || '',
	clientId: process.env.VIEWCOMFY_CLIENT_ID || '',
	clientSecret: process.env.VIEWCOMFY_CLIENT_SECRET || ''
}

async function generateViewComfyStreamHandler(
	req: ExtendedNextApiRequest,
	res: NextApiResponse
) {
	// Run CORS middleware
	await runMiddleware(req, res, cors)

	if (req.method !== 'POST') {
		return res.status(405).json({ 
			success: false, 
			error: 'Method not allowed' 
		})
	}

	// Rate limiting
	const identifier = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'anonymous'
	if (!rateLimiter.isAllowed(identifier)) {
		return res.status(429).json({ 
			success: false,
			error: 'Too many requests. Please try again later.'
		})
	}

	const { prompt, workflowParams }: ViewComfyGenerateRequest = req.body

	// Validate input
	if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
		return res.status(400).json({ 
			success: false, 
			error: 'Prompt is required' 
		})
	}

	// Check ViewComfy configuration
	if (!viewComfyConfig.inferUrl || !viewComfyConfig.clientId || !viewComfyConfig.clientSecret) {
		logger.error('ViewComfy API is not configured properly')
		return res.status(500).json({ 
			success: false, 
			error: 'ViewComfy service is not configured properly' 
		})
	}

	// Set up SSE headers
	res.setHeader('Content-Type', 'text/event-stream')
	res.setHeader('Cache-Control', 'no-cache')
	res.setHeader('Connection', 'keep-alive')

	// Helper to send SSE messages
	const sendSSE = (event: string, data: Record<string, unknown>) => {
		res.write(`event: ${event}\n`)
		res.write(`data: ${JSON.stringify(data)}\n\n`)
	}

	try {
		// Initialize ViewComfy client
		const client = new ViewComfyClient(viewComfyConfig)

		// Create parameters
		const params = workflowParams || createUIGenerationParams(prompt)

		// Make sure params aren't empty
		if (Object.keys(params).length === 0) {
			params['3-inputs-seed'] = Math.floor(Math.random() * 1000000000000000)
		}

		logger.info('Starting ViewComfy streaming generation', {
			requestId: req.id,
			promptLength: prompt.length
		})

		// Send initial status
		sendSSE('status', { message: 'Starting generation...' })

		// Call ViewComfy with streaming
		const result = await client.inferWithLogs(
			params,
			(logMessage) => {
				// Send log messages to client
				sendSSE('log', { message: logMessage })
			}
		)

		if (result) {
			// Send the final result
			sendSSE('complete', {
				promptId: result.promptId,
				outputs: result.outputs.map(output => ({
					filename: output.filename,
					content_type: output.contentType,
					data: output.data,
					size: output.size
				})),
				executionTime: result.executionTimeSeconds
			})

			logger.info('ViewComfy streaming generation completed', {
				requestId: req.id,
				promptId: result.promptId,
				outputCount: result.outputs.length
			})
		} else {
			sendSSE('error', { message: 'No result received from ViewComfy' })
		}

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		
		logger.error('ViewComfy streaming error', error instanceof Error ? error : null, {
			requestId: req.id,
			errorMessage
		})

		sendSSE('error', { 
			message: 'Generation failed',
			details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
		})
	} finally {
		// Close the connection
		res.end()
	}
}

export default generateViewComfyStreamHandler