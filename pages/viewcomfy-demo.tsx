import { useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import ViewComfyGenerator from '../components/viewcomfy-generator'
import { useViewComfy } from '../lib/hooks/use-viewcomfy'
import type { ViewComfyFileOutput } from '../lib/types'

export default function ViewComfyDemo() {
	const [streamingPrompt, setStreamingPrompt] = useState('')
	const [savedOutputs, setSavedOutputs] = useState<ViewComfyFileOutput[]>([])

	// Hook for streaming generation
	const {
		generateWithStreaming,
		isGenerating,
		error,
		outputs,
		logs,
		executionTime,
		reset
	} = useViewComfy({
		useStreaming: true,
		onSuccess: (outputs) => {
			console.log('Generation successful:', outputs)
		}
	})

	const handleStreamingGenerate = async () => {
		if (!streamingPrompt.trim()) return
		await generateWithStreaming(streamingPrompt)
	}

	const handleSaveOutputs = (newOutputs: ViewComfyFileOutput[]) => {
		setSavedOutputs(prev => [...prev, ...newOutputs])
	}

	const downloadImage = (output: ViewComfyFileOutput) => {
		// Create blob from base64
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
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	return (
		<>
			<Head>
				<title>ViewComfy Integration Demo - VRUX</title>
				<meta name="description" content="Demo of ViewComfy API integration for UI generation" />
			</Head>

			<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="container mx-auto px-4 py-8">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
						ViewComfy Integration Demo
					</h1>

					<div className="space-y-8">
						{/* Basic Generator Component */}
						<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
								Basic ViewComfy Generator
							</h2>
							<ViewComfyGenerator 
								onGenerate={handleSaveOutputs}
								className="max-w-2xl"
							/>
						</section>

						{/* Streaming Generator with Hook */}
						<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
							<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
								Streaming Generator (with real-time logs)
							</h2>
							
							<div className="max-w-2xl space-y-4">
								<div className="flex gap-2">
									<input
										type="text"
										value={streamingPrompt}
										onChange={(e) => setStreamingPrompt(e.target.value)}
										placeholder="Describe your UI..."
										disabled={isGenerating}
										className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
									/>
									<button
										onClick={handleStreamingGenerate}
										disabled={isGenerating || !streamingPrompt.trim()}
										className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isGenerating ? 'Generating...' : 'Generate with Logs'}
									</button>
									{outputs.length > 0 && (
										<button
											onClick={reset}
											className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
										>
											Clear
										</button>
									)}
								</div>

								{error && (
									<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
										<p className="text-red-600 dark:text-red-400">{error.message}</p>
									</div>
								)}

								{logs.length > 0 && (
									<div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
										<h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
											Generation Logs:
										</h3>
										<div className="space-y-1 text-xs font-mono text-gray-600 dark:text-gray-400">
											{logs.map((log, i) => (
												<div key={i}>{log}</div>
											))}
										</div>
									</div>
								)}

								{outputs.length > 0 && (
									<div className="space-y-4">
										{executionTime && (
											<p className="text-sm text-gray-600 dark:text-gray-400">
												Generated in {executionTime.toFixed(2)} seconds
											</p>
										)}
										<div className="grid grid-cols-1 gap-4">
											{outputs.map((output, index) => (
												<div key={index} className="relative group">
													<Image
														src={`data:${output.content_type};base64,${output.data}`}
														alt={`Generated UI ${index + 1}`}
														width={800}
														height={600}
														className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
														unoptimized
													/>
													<button
														onClick={() => {
															downloadImage(output)
															handleSaveOutputs([output])
														}}
														className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white px-3 py-1 rounded text-sm"
													>
														Download
													</button>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</section>

						{/* Saved Outputs Gallery */}
						{savedOutputs.length > 0 && (
							<section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
								<h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
									Saved Outputs ({savedOutputs.length})
								</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{savedOutputs.map((output, index) => (
										<div key={index} className="relative group">
											<div className="relative w-full h-48">
												<Image
													src={`data:${output.content_type};base64,${output.data}`}
													alt={`Saved UI ${index + 1}`}
													fill
													className="object-cover rounded-lg border border-gray-200 dark:border-gray-700"
													unoptimized
												/>
											</div>
											<button
												onClick={() => downloadImage(output)}
												className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white"
											>
												<span className="bg-black/75 px-3 py-1 rounded">
													Download
												</span>
											</button>
										</div>
									))}
								</div>
							</section>
						)}
					</div>
				</div>
			</div>
		</>
	)
}