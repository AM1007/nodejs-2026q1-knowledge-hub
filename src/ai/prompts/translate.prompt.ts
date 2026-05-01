export function buildTranslatePrompt(
  articleContent: string,
  targetLanguage: string,
  sourceLanguage?: string,
): string {
  const sourceClause = sourceLanguage ? `from ${sourceLanguage} ` : '';

  return `Translate the following article ${sourceClause}to ${targetLanguage}.
Return only the translated text, without any explanations or notes.

Article:
${articleContent}

Translation:`;
}
