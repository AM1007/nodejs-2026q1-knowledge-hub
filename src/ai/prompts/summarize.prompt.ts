export type SummaryLength = 'short' | 'medium' | 'detailed';

const lengthInstructions: Record<SummaryLength, string> = {
  short: 'in 1-2 sentences',
  medium: 'in 3-5 sentences',
  detailed: 'in 1-2 paragraphs',
};

export function buildSummarizePrompt(
  articleContent: string,
  maxLength: SummaryLength = 'medium',
): string {
  return `Summarize the following article ${lengthInstructions[maxLength]}.

Article:
${articleContent}

Summary:`;
}
