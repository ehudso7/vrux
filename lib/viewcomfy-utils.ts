/**
 * Utility functions for ViewComfy integration
 */

/**
 * Flattens workflow API JSON structure into simple key-value parameters
 * @param workflow - The workflow API JSON object
 * @returns Flattened object with keys in format "nodeId-inputs-paramName"
 */
export function createWorkflowParameters(
	workflow: Record<string, Record<string, unknown>>
): Record<string, unknown> {
	const flattened: Record<string, unknown> = {}

	// Iterate through each node in the workflow
	Object.entries(workflow).forEach(([nodeId, node]) => {
		// Type assertion for node properties
		const nodeData = node as {
			_meta?: { title?: string };
			class_type?: string;
			inputs?: Record<string, unknown>;
		}

		// Add the class_type-info key, preferring _meta.title if available
		const classTypeInfo = nodeData._meta?.title || nodeData.class_type
		if (classTypeInfo) {
			flattened[`_${nodeId}-node-class_type-info`] = classTypeInfo
		}

		// Process all inputs
		if (nodeData.inputs) {
			Object.entries(nodeData.inputs).forEach(([inputKey, inputValue]) => {
				flattened[`${nodeId}-inputs-${inputKey}`] = inputValue
			})
		}
	})

	return flattened
}

/**
 * Convert text prompt to image generation parameters
 * Common parameter mappings for text-to-image workflows
 */
export function createTextToImageParams(
	prompt: string,
	negativePrompt?: string,
	seed?: number
): Record<string, unknown> {
	const params: Record<string, unknown> = {}

	// Common node IDs for prompts (may need adjustment based on workflow)
	if (prompt) {
		params['6-inputs-text'] = prompt // Positive prompt
	}

	if (negativePrompt) {
		params['7-inputs-text'] = negativePrompt // Negative prompt
	}

	if (seed !== undefined) {
		params['3-inputs-seed'] = seed // KSampler seed
	}

	return params
}

/**
 * Convert image + text prompt to image generation parameters
 * Common parameter mappings for image-to-image workflows
 */
export function createImageToImageParams(
	prompt: string,
	imageFile: File | Blob,
	strength?: number,
	seed?: number
): Record<string, unknown> {
	const params: Record<string, unknown> = {}

	// Text prompt
	if (prompt) {
		params['6-inputs-text'] = prompt
	}

	// Input image
	params['52-inputs-image'] = imageFile

	// Denoise strength (if supported by workflow)
	if (strength !== undefined) {
		params['3-inputs-denoise'] = strength
	}

	// Seed
	if (seed !== undefined) {
		params['3-inputs-seed'] = seed
	}

	return params
}

/**
 * Generate a random seed for reproducible results
 */
export function generateRandomSeed(): number {
	return Math.floor(Math.random() * 1000000000000000)
}

/**
 * Default negative prompts for common workflows
 */
export const DEFAULT_NEGATIVE_PROMPTS = {
	general: 'low quality, blurry, pixelated, noisy, oversaturated, undersaturated',
	realistic: 'cartoon, anime, illustration, painting, drawing, art, sketch, render, CG, 3d, unrealistic',
	anime: 'realistic, photo, photorealistic, 3d render, hyperrealistic, ugly',
}

/**
 * Helper to create UI generation specific parameters
 */
export function createUIGenerationParams(
	uiDescription: string,
	style?: 'modern' | 'minimal' | 'colorful' | 'dark',
	seed?: number
): Record<string, unknown> {
	// Map UI description to image generation prompt
	const styleMap = {
		modern: 'clean modern UI design, professional, sleek',
		minimal: 'minimalist UI design, simple, clean lines, lots of whitespace',
		colorful: 'vibrant colorful UI design, engaging, dynamic',
		dark: 'dark mode UI design, elegant, sophisticated'
	}

	const stylePrompt = style ? styleMap[style] : ''
	const fullPrompt = `${uiDescription}, ${stylePrompt}, high quality UI mockup, web interface design`

	return createTextToImageParams(
		fullPrompt,
		'low quality, blurry, text, code, programming',
		seed || generateRandomSeed()
	)
}