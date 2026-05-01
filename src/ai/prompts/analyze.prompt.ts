export type AnalyzeTask = 'review' | 'bugs' | 'optimize' | 'explain';

const taskInstructions: Record<AnalyzeTask, string> = {
  review:
    'Provide a critical review of the article, focusing on clarity, structure, and accuracy.',
  bugs: 'Identify factual errors, logical inconsistencies, or technical mistakes in the article.',
  optimize:
    'Suggest improvements to make the article clearer, more concise, and better structured.',
  explain: 'Explain the main concepts of the article in simpler terms.',
};

export function buildAnalyzePrompt(
  articleContent: string,
  task: AnalyzeTask = 'review',
): string {
  return `${taskInstructions[task]}

Respond in valid JSON with the following structure:
{
  "analysis": "<your main analysis>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", ...],
  "severity": "info" | "warning" | "error"
}

Article:
${articleContent}

JSON response:`;
}
