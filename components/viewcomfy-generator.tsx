import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { ViewComfyFileOutput } from '../lib/types'

interface ViewComfyGeneratorProps {
	onGenerate?: (outputs: ViewComfyFileOutput[]) => void
	className?: string
}

export default function ViewComfyGenerator({ onGenerate, className = '' }: ViewComfyGeneratorProps) {
	const [prompt, setPrompt] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [outputs, setOutputs] = useState<ViewComfyFileOutput[]>([])
	const [executionTime, setExecutionTime] = useState<number | null>(null)

	const handleGenerate = useCallback(async () => {
		if (!prompt.trim() || isGenerating) return

		setIsGenerating(true)
		setError(null)
		setOutputs([])
		setExecutionTime(null)

		try {
			const response = await fetch('/api/generate-viewcomfy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					prompt: prompt.trim(),
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
				onGenerate?.(data.outputs)
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An error occurred'
			setError(message)
			console.error('ViewComfy generation error:', err)
		} finally {
			setIsGenerating(false)
		}
	}, [prompt, isGenerating, onGenerate])

	const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleGenerate()
		}
	}, [handleGenerate])

	return (
		<div className={`flex flex-col gap-4 ${className}`}>
			<div className="flex flex-col gap-2">
				<label htmlFor="viewcomfy-prompt" className="text-sm font-medium text-gray-700 dark:text-gray-300">
					Generate UI Mockup with ViewComfy
				</label>
				<div className="flex gap-2">
					<input
						id="viewcomfy-prompt"
						type="text"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						onKeyPress={handleKeyPress}
						placeholder="Describe the UI you want to generate..."
						disabled={isGenerating}
						className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
					/>
					<button
						onClick={handleGenerate}
						disabled={isGenerating || !prompt.trim()}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isGenerating ? 'Generating...' : 'Generate'}
					</button>
				</div>
			</div>

			{error && (
				<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
					<p className="text-red-600 dark:text-red-400">{error}</p>
				</div>
			)}

			{isGenerating && (
				<div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
					<div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
					<p className="text-blue-600 dark:text-blue-400">
						Generating UI mockup... This may take a moment on first run due to cold start.
					</p>
				</div>
			)}

			{outputs.length > 0 && (
				<div className="space-y-4">
					{executionTime && (
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Generated in {executionTime.toFixed(2)} seconds
						</p>
					)}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{outputs.map((output, index) => (
							<div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
								{output.content_type.startsWith('image/') ? (
									<Image
										src={`data:${output.content_type};base64,${output.data}`}
										alt={`Generated UI ${index + 1}`}
										width={800}
										height={600}
										className="w-full h-auto"
										unoptimized
									/>
								) : (
									<div className="p-4">
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{output.filename} ({(output.size / 1024).toFixed(2)} KB)
										</p>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}