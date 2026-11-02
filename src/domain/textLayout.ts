export function fitTextSize(
  text: string,
  preferred: number,
  minimum: number,
  maxWidth: number,
  measure: (value: string, size: number) => number,
): number {
  let low = Math.max(1, minimum),
    high = Math.max(low, preferred);
  if (measure(text, high) <= maxWidth) return high;
  for (let index = 0; index < 14; index += 1) {
    const mid = (low + high) / 2;
    if (measure(text, mid) <= maxWidth) low = mid;
    else high = mid;
  }
  return low;
}

export function wrapText(
  text: string,
  size: number,
  maxWidth: number,
  measure: (value: string, size: number) => number,
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate, size) <= maxWidth || !line) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
