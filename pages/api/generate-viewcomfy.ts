import type { NextApiRequest, NextApiResponse } from 'next'
import { ViewComfyClient } from '../../lib/viewcomfy-client'
import rateLimiter from '../../lib/rate-limiter'
import cors, { runMiddleware } from '../../lib/cors'
import requestLogger from '../../lib/middleware/request-logger'
import logger from '../../lib/logger'
import performanceMonitor from '../../lib/performance'
import { createUIGenerationParams } from '../../lib/viewcomfy-utils'
import type { ViewComfyGenerateRequest, ViewComfyGenerateResponse } from '../../lib/types'

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

async function generateViewComfyHandler(
	req: ExtendedNextApiRequest,
	res: NextApiResponse<ViewComfyGenerateResponse>
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

	const { prompt, workflowParams, useStreaming = false }: ViewComfyGenerateRequest = req.body

	// Validate input
	if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
		return res.status(400).json({ 
			success: false, 
			error: 'Prompt is required' 
		})
	}

	if (prompt.length > 1000) {
		return res.status(400).json({ 
			success: false, 
			error: 'Prompt is too long (max 1000 characters)' 
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

	try {
		// Start performance monitoring
		performanceMonitor.startTimer('viewComfyGeneration')

		// Initialize ViewComfy client
		const client = new ViewComfyClient(viewComfyConfig)

		// Create parameters - use provided params or generate from prompt
		const params = workflowParams || createUIGenerationParams(prompt)

		// Make sure params aren't empty (ViewComfy requirement)
		if (Object.keys(params).length === 0) {
			params['3-inputs-seed'] = Math.floor(Math.random() * 1000000000000000)
		}

		logger.info('Starting ViewComfy generation', {
			requestId: req.id,
			promptLength: prompt.length,
			useStreaming
		})

		let result

		if (useStreaming) {
			// For streaming, we'll need to handle this differently
			// For now, just use regular inference
			result = await client.infer(params)
		} else {
			result = await client.infer(params)
		}

		// End performance monitoring
		const generationTime = performanceMonitor.endTimer('viewComfyGeneration', {
			promptLength: prompt.length,
			outputCount: result.outputs.length
		})

		// Log successful generation
		logger.info('ViewComfy generation completed successfully', {
			requestId: req.id,
			promptId: result.promptId,
			outputCount: result.outputs.length,
			executionTime: result.executionTimeSeconds,
			generationTime: generationTime ? `${generationTime.toFixed(2)}ms` : 'unknown'
		})

		// Return response
		res.status(200).json({
			success: true,
			promptId: result.promptId,
			outputs: result.outputs.map(output => ({
				filename: output.filename,
				content_type: output.contentType,
				data: output.data,
				size: output.size
			})),
			executionTime: result.executionTimeSeconds
		})

	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		const errorObject = error instanceof Error ? error : null

		logger.error('ViewComfy API error', errorObject, {
			requestId: req.id,
			errorMessage
		})

		// Handle specific error cases
		if (errorMessage.includes('cold start')) {
			return res.status(503).json({
				success: false,
				error: 'Service is warming up. Please try again in a moment.'
			})
		}

		res.status(500).json({
			success: false,
			error: 'Failed to generate with ViewComfy. Please try again.',
			...(process.env.NODE_ENV === 'development' && { details: errorMessage })
		})
	}
}

export default requestLogger(generateViewComfyHandler)