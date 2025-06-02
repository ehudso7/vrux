import { z } from 'zod';
import { getAvailableProvider } from './ai-providers';
import type OpenAI from 'openai';

// Schema for image analysis results
export const imageAnalysisSchema = z.object({
  layout: z.enum(['grid', 'flex', 'hero', 'card', 'form', 'dashboard', 'landing']),
  primaryColors: z.array(z.string()),
  components: z.array(z.string()),
  textContent: z.array(z.string()),
  hasNavigation: z.boolean(),
  hasSidebar: z.boolean(),
  hasFooter: z.boolean(),
  style: z.enum(['modern', 'minimal', 'corporate', 'playful', 'elegant']),
  spacing: z.enum(['tight', 'normal', 'relaxed']),
  borderRadius: z.enum(['none', 'small', 'medium', 'large', 'full']),
});

export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>;

export async function analyzeImage(imageBase64: string): Promise<ImageAnalysis> {
  try {
    const provider = await getAvailableProvider();
    
    // Check if provider supports vision
    if (!provider.supportsVision) {
      // Fallback to mock analysis for providers without vision
      return {
        layout: 'flex',
        primaryColors: ['#3B82F6', '#1F2937', '#F3F4F6'],
        components: ['button', 'card', 'input', 'text'],
        textContent: [],
        hasNavigation: false,
        hasSidebar: false,
        hasFooter: false,
        style: 'modern',
        spacing: 'normal',
        borderRadius: 'medium',
      };
    }
    
    const systemPrompt = `You are an expert UI/UX analyzer. Analyze the provided image and extract:
1. Layout type (grid, flex, hero, card, form, dashboard, landing)
2. Primary colors (as hex codes)
3. UI components present (button, input, card, nav, etc.)
4. Any visible text content
5. Presence of navigation, sidebar, footer
6. Overall style (modern, minimal, corporate, playful, elegant)
7. Spacing approach (tight, normal, relaxed)
8. Border radius style (none, small, medium, large, full)

Return a valid JSON object matching the required schema.`;
    
    const userPrompt = "Analyze this UI design and extract the components and styling:";
    
    // For OpenAI, we need to use their specific vision format
    if (provider.name === 'openai') {
      const openai = (provider as { client: OpenAI }).client;
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No analysis returned');
    }

    const parsed = JSON.parse(content);
    return imageAnalysisSchema.parse(parsed);
    } else {
      // For other providers, vision is not yet supported
      throw new Error('Image analysis not supported with current provider');
    }
  } catch (error) {
    console.error('Image analysis error:', error);
    throw new Error('Failed to analyze image');
  }
}

export function generatePromptFromAnalysis(analysis: ImageAnalysis): string {
  const components = analysis.components.join(', ');
  const colors = analysis.primaryColors.slice(0, 3).join(', ');
  
  let prompt = `Create a ${analysis.style} ${analysis.layout} layout with the following:\n\n`;
  
  // Layout structure
  if (analysis.hasNavigation) prompt += "- Navigation bar at the top\n";
  if (analysis.hasSidebar) prompt += "- Sidebar for additional content/navigation\n";
  if (analysis.hasFooter) prompt += "- Footer section\n";
  
  // Components
  prompt += `\nComponents to include: ${components}\n`;
  
  // Styling
  prompt += `\nStyling guidelines:
- Color scheme: ${colors}
- Spacing: ${analysis.spacing}
- Border radius: ${analysis.borderRadius}
- Overall style: ${analysis.style}\n`;
  
  // Text content
  if (analysis.textContent.length > 0) {
    prompt += `\nInclude this text content: ${analysis.textContent.slice(0, 5).join(', ')}\n`;
  }
  
  prompt += "\nMake it responsive, accessible, and use modern React patterns with Tailwind CSS.";
  
  return prompt;
}

// Convert image file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 20 * 1024 * 1024; // 20MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 20MB.' };
  }
  
  return { valid: true };
}