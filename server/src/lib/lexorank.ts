const BUCKET = '0';
const SEP = '|';

function encodeMiddle(value: string): string {
  return `${BUCKET}${SEP}${value}:`;
}

function decodeMiddle(rank: string): string {
  const parts = rank.split(SEP);
  if (parts.length < 2) return rank;
  const tail = parts[1] ?? '';
  return tail.endsWith(':') ? tail.slice(0, -1) : tail;
}

function charMid(left: number, right: number): number | null {
  if (right - left > 1) {
    return Math.floor((left + right) / 2);
  }
  return null;
}

export function initialRank(): string {
  return encodeMiddle('m');
}

export function rankAfter(previous: string | null): string {
  if (!previous) return initialRank();
  const body = decodeMiddle(previous);
  return encodeMiddle(`${body}m`);
}

export function rankBefore(next: string): string {
  const body = decodeMiddle(next);
  if (body.length === 0) return encodeMiddle('a');
  const first = body.codePointAt(0);
  if (first === undefined) return initialRank();
  if (first > 97) {
    return encodeMiddle(String.fromCodePoint(first - 1));
  }
  return encodeMiddle(`a${body}`);
}

export function rankBetween(before: string | null, after: string | null): string {
  if (!before && !after) return initialRank();
  if (!before) return rankBefore(after!);
  if (!after) return rankAfter(before);

  const left = decodeMiddle(before);
  const right = decodeMiddle(after);
  if (left >= right) {
    throw new Error('Invalid rank bounds: left must be less than right');
  }

  const maxLen = Math.max(left.length, right.length);
  for (let index = 0; index < maxLen; index += 1) {
    const leftCode = index < left.length ? (left.codePointAt(index) ?? 0) : 0;
    const rightCode = index < right.length ? (right.codePointAt(index) ?? 123) : 123;
    if (leftCode === rightCode) continue;

    const mid = charMid(leftCode, rightCode);
    if (mid !== null) {
      return encodeMiddle(left.slice(0, index) + String.fromCodePoint(mid));
    }
    if (index < left.length) {
      return encodeMiddle(`${left.slice(0, index + 1)}m`);
    }
    return encodeMiddle(`${left}m`);
  }

  return encodeMiddle(`${left}m`);
}

export function compareRank(a: string, b: string): number {
  const left = decodeMiddle(a);
  const right = decodeMiddle(b);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
