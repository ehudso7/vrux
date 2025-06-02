import type { 
	ViewComfyParams, 
	ViewComfyResponse, 
	ViewComfyOptions
} from './types'

/**
 * ViewComfy API client for making requests to ComfyUI workflows
 */
export class ViewComfyClient {
	private inferUrl: string
	private clientId: string
	private clientSecret: string

	constructor(options: ViewComfyOptions) {
		if (!options.inferUrl) {
			throw new Error('ViewComfy inferUrl is required')
		}
		if (!options.clientId) {
			throw new Error('ViewComfy clientId is required')
		}
		if (!options.clientSecret) {
			throw new Error('ViewComfy clientSecret is required')
		}

		this.inferUrl = options.inferUrl
		this.clientId = options.clientId
		this.clientSecret = options.clientSecret
	}

	/**
	 * Parse parameters into form data format
	 */
	private parseParameters(params: ViewComfyParams): {
		parsedParams: Record<string, unknown>
		files: Array<{ key: string; file: File | Blob }>
	} {
		const parsedParams: Record<string, unknown> = {}
		const files: Array<{ key: string; file: File | Blob }> = []

		Object.entries(params).forEach(([key, value]) => {
			if (value instanceof File || value instanceof Blob) {
				files.push({ key, file: value })
			} else {
				parsedParams[key] = value
			}
		})

		return { parsedParams, files }
	}

	/**
	 * Make a standard POST request to ViewComfy API
	 */
	async infer(
		params: ViewComfyParams,
		overrideWorkflowApi?: Record<string, unknown>
	): Promise<PromptResult> {
		const { parsedParams, files } = this.parseParameters(params)

		const formData = new FormData()
		formData.append('logs', 'false')
		formData.append('params', JSON.stringify(parsedParams))
		
		if (overrideWorkflowApi) {
			formData.append('workflow_api', JSON.stringify(overrideWorkflowApi))
		}

		// Add files to form data
		files.forEach(({ key, file }) => {
			formData.append(key, file)
		})

		const response = await fetch(this.inferUrl, {
			method: 'POST',
			headers: {
				'client_id': this.clientId,
				'client_secret': this.clientSecret,
			},
			body: formData,
			signal: AbortSignal.timeout(2400000), // 40 minute timeout
		})

		if (response.status === 201) {
			const data = await response.json()
			return new PromptResult(data)
		} else {
			const errorText = await response.text()
			throw new Error(`API request failed with status ${response.status}: ${errorText}`)
		}
	}

	/**
	 * Make a streaming request with real-time logs
	 */
	async inferWithLogs(
		params: ViewComfyParams,
		loggingCallback: (message: string) => void,
		overrideWorkflowApi?: Record<string, unknown>
	): Promise<PromptResult | null> {
		const { parsedParams, files } = this.parseParameters(params)

		const formData = new FormData()
		formData.append('logs', 'true')
		formData.append('params', JSON.stringify(parsedParams))
		
		if (overrideWorkflowApi) {
			formData.append('workflow_api', JSON.stringify(overrideWorkflowApi))
		}

		// Add files to form data
		files.forEach(({ key, file }) => {
			formData.append(key, file)
		})

		const response = await fetch(this.inferUrl, {
			method: 'POST',
			headers: {
				'client_id': this.clientId,
				'client_secret': this.clientSecret,
			},
			body: formData,
			signal: AbortSignal.timeout(2400000), // 40 minute timeout
		})

		if (response.status !== 201) {
			const errorText = await response.text()
			throw new Error(`API request failed with status ${response.status}: ${errorText}`)
		}

		// Check if it's a streaming response
		const contentType = response.headers.get('content-type') || ''
		if (!contentType.includes('text/event-stream')) {
			throw new Error('Expected streaming response but got regular response')
		}

		// Process Server-Sent Events
		const reader = response.body?.getReader()
		const decoder = new TextDecoder()
		
		if (!reader) {
			throw new Error('Response body is not readable')
		}

		let currentData = ''
		let currentEvent = 'message'
		let promptResult: PromptResult | null = null

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			const chunk = decoder.decode(value, { stream: true })
			const lines = chunk.split('\n')

			for (const line of lines) {
				const trimmedLine = line.trim()

				// Empty line signals end of event
				if (!trimmedLine) {
					if (currentData) {
						try {
							if (currentEvent === 'log_message' || currentEvent === 'error') {
								loggingCallback(`${currentEvent}: ${currentData}`)
							} else if (currentEvent === 'prompt_result') {
								const data = JSON.parse(currentData)
								promptResult = new PromptResult(data)
								return promptResult
							}
						} catch (e) {
							console.error('Failed to parse event data:', e)
						}
						currentData = ''
						currentEvent = 'message'
					}
					continue
				}

				// Parse SSE fields
				if (trimmedLine.startsWith('event:')) {
					currentEvent = trimmedLine.slice(6).trim()
				} else if (trimmedLine.startsWith('data:')) {
					currentData = trimmedLine.slice(5).trim()
				}
			}
		}

		return promptResult
	}
}

/**
 * FileOutput class representing a generated file
 */
export class FileOutput {
	filename: string
	contentType: string
	data: string
	size: number

	constructor(data: {
		filename: string
		content_type: string
		data: string
		size: number
	}) {
		this.filename = data.filename
		this.contentType = data.content_type
		this.data = data.data
		this.size = data.size
	}

	/**
	 * Convert base64 data to Blob
	 */
	toBlob(): Blob {
		const binaryString = atob(this.data)
		const bytes = new Uint8Array(binaryString.length)
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i)
		}
		return new Blob([bytes], { type: this.contentType })
	}

	/**
	 * Convert to data URL for direct display
	 */
	toDataURL(): string {
		return `data:${this.contentType};base64,${this.data}`
	}
}

/**
 * PromptResult class representing the API response
 */
class PromptResult {
	promptId: string
	status: string
	completed: boolean
	executionTimeSeconds: number
	prompt: Record<string, unknown>
	outputs: FileOutput[]

	constructor(data: ViewComfyResponse) {
		this.promptId = data.prompt_id
		this.status = data.status
		this.completed = data.completed
		this.executionTimeSeconds = data.execution_time_seconds
		this.prompt = data.prompt
		this.outputs = (data.outputs || []).map(output => new FileOutput(output))
	}
}