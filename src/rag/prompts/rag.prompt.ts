export interface RagPromptInput {
  question: string;
  contextChunks: Array<{ title: string; text: string }>;
}

export function buildRagPrompt(input: RagPromptInput): string {
  if (input.contextChunks.length === 0) {
    return [
      'You are a Knowledge Hub assistant.',
      'No relevant context was found for the question.',
      'Reply briefly that you cannot answer based on available knowledge.',
      '',
      `Question: ${input.question}`,
    ].join('\n');
  }

  const context = input.contextChunks
    .map((c, i) => `[${i + 1}] (${c.title}) ${c.text}`)
    .join('\n');

  return [
    'You are a Knowledge Hub assistant.',
    'Answer ONLY using the context below.',
    'If the answer is not in the context, say so briefly.',
    'Keep the answer concise.',
    '',
    'Context:',
    context,
    '',
    `Question: ${input.question}`,
  ].join('\n');
}
