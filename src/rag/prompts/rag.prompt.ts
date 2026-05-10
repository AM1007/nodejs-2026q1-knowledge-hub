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

export interface RerankPromptInput {
  question: string;
  candidates: Array<{ index: number; text: string }>;
  topK: number;
}

export function buildRerankPrompt(input: RerankPromptInput): string {
  const list = input.candidates.map((c) => `[${c.index}] ${c.text}`).join('\n');

  return [
    `You are a relevance ranker. Pick the ${input.topK} most relevant items for the question.`,
    'Return ONLY a JSON array of integer ids in best-to-worst order.',
    'No prose, no code fences, no explanation. Example: [3,1,4,2,0]',
    '',
    `Question: ${input.question}`,
    '',
    'Items:',
    list,
  ].join('\n');
}
