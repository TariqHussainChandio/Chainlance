// Pure text-processing utilities for the TF-IDF recommendation engine.
// No I/O, no Firestore, no async — every function is deterministic.

const STOPWORDS: ReadonlySet<string> = new Set([
  "the","and","for","to","a","of","in","is","it","with","on","that","this",
  "as","at","by","an","be","are","from","or","have","has","i","you","my",
  "your","we","our","they","them","their","can","will","do","does","not",
  "no","yes","if","but","than","so","up","out","was","were","been","into","any",
]);

const TOKEN_SPLIT_RE = /[^a-z0-9]+/g;

export function tokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(TOKEN_SPLIT_RE)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export function termFreq(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;
  for (const tok of tokens) {
    tf.set(tok, (tf.get(tok) ?? 0) + 1);
  }
  const total = tokens.length;
  for (const [k, v] of tf) tf.set(k, v / total);
  return tf;
}

export function buildIdf(docs: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const N = docs.length;
  if (N === 0) return idf;
  const docFreq = new Map<string, number>();
  for (const tokens of docs) {
    const seen = new Set(tokens);
    for (const tok of seen) {
      docFreq.set(tok, (docFreq.get(tok) ?? 0) + 1);
    }
  }
  for (const [tok, df] of docFreq) {
    idf.set(tok, Math.log(N / df));
  }
  return idf;
}

export function tfidfVector(
  tokens: string[],
  idf: Map<string, number>
): Map<string, number> {
  const tf = termFreq(tokens);
  const vec = new Map<string, number>();
  for (const [tok, tfVal] of tf) {
    const idfVal = idf.get(tok) ?? 0;
    if (idfVal > 0) vec.set(tok, tfVal * idfVal);
  }
  return vec;
}

export function cosineSimilarity(
  vec1: Map<string, number>,
  vec2: Map<string, number>
): number {
  if (vec1.size === 0 || vec2.size === 0) return 0;
  const [small, large] = vec1.size <= vec2.size ? [vec1, vec2] : [vec2, vec1];
  let dot = 0;
  for (const [tok, v] of small) {
    const other = large.get(tok);
    if (other) dot += v * other;
  }
  if (dot === 0) return 0;
  let mag1 = 0;
  for (const v of vec1.values()) mag1 += v * v;
  let mag2 = 0;
  for (const v of vec2.values()) mag2 += v * v;
  const denom = Math.sqrt(mag1) * Math.sqrt(mag2);
  return denom === 0 ? 0 : dot / denom;
}
