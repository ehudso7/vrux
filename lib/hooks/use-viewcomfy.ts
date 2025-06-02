import { useState, useCallback } from 'react'
import type { ViewComfyFileOutput, ViewComfyParams } from '../types'

interface UseViewComfyOptions {
	onSuccess?: (outputs: ViewComfyFileOutput[]) => void
	onError?: (error: Error) => void
	useStreaming?: boolean
}

interface UseViewComfyReturn {
	generate: (prompt: string, params?: ViewComfyParams) => Promise<void>
	generateWithStreaming: (prompt: string, params?: ViewComfyParams) => Promise<void>
	isGenerating: boolean
	error: Error | null
	outputs: ViewComfyFileOutput[]
	logs: string[]
	executionTime: number | null
	reset: () => void
}

export function useViewComfy(options: UseViewComfyOptions = {}): UseViewComfyReturn {
	const { onSuccess, onError, useStreaming = false } = options

	const [isGenerating, setIsGenerating] = useState(false)
	const [error, setError] = useState<Error | null>(null)
	const [outputs, setOutputs] = useState<ViewComfyFileOutput[]>([])
	const [logs, setLogs] = useState<string[]>([])
	const [executionTime, setExecutionTime] = useState<number | null>(null)

	const reset = useCallback(() => {
		setError(null)
		setOutputs([])
		setLogs([])
		setExecutionTime(null)
	}, [])

	const generate = useCallback(async (prompt: string, params?: ViewComfyParams) => {
		if (isGenerating) return

		setIsGenerating(true)
		reset()

		try {
			const response = await fetch('/api/generate-viewcomfy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt,
					workflowParams: params,
					useStreaming: false
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to generate')
			}

			if (data.success && data.outputs) {
				setOutputs(data.outputs)
				setExecutionTime(data.executionTime)
				onSuccess?.(data.outputs)
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Unknown error')
			setError(error)
			onError?.(error)
			throw error
		} finally {
			setIsGenerating(false)
		}
	}, [isGenerating, reset, onSuccess, onError])

	const generateWithStreaming = useCallback(async (prompt: string, params?: ViewComfyParams) => {
		if (isGenerating) return

		setIsGenerating(true)
		reset()

		try {
			const response = await fetch('/api/generate-viewcomfy-stream', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt,
					workflowParams: params
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to generate')
			}

			const reader = response.body?.getReader()
			const decoder = new TextDecoder()

			if (!reader) {
				throw new Error('Response body is not readable')
			}

			let buffer = ''

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split('\n')
				
				// Process all complete lines
				for (let i = 0; i < lines.length - 1; i++) {
					const line = lines[i].trim()
					
					if (line.startsWith('event:')) {
						const event = line.slice(6).trim()
						const nextLine = lines[i + 1]?.trim()
						
						if (nextLine?.startsWith('data:')) {
							const data = JSON.parse(nextLine.slice(5).trim())
							
							switch (event) {
								case 'log':
									setLogs(prev => [...prev, data.message])
									break
								case 'status':
									setLogs(prev => [...prev, `Status: ${data.message}`])
									break
								case 'complete':
									setOutputs(data.outputs)
									setExecutionTime(data.executionTime)
									onSuccess?.(data.outputs)
									break
								case 'error':
									throw new Error(data.message || 'Generation failed')
							}
						}
						i++ // Skip the data line we just processed
					}
				}
				
				// Keep the last incomplete line in the buffer
				buffer = lines[lines.length - 1]
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Unknown error')
			setError(error)
			onError?.(error)
			throw error
		} finally {
			setIsGenerating(false)
		}
	}, [isGenerating, reset, onSuccess, onError])

	return {
		generate: useStreaming ? generateWithStreaming : generate,
		generateWithStreaming,
		isGenerating,
		error,
		outputs,
		logs,
		executionTime,
		reset
	}
}