import type { SkillResult } from './types';

const OPERATOR_WORDS: Array<[RegExp, string]> = [
  [/multiplied by/g, '*'],
  [/divided by/g, '/'],
  [/times/g, '*'],
  [/plus/g, '+'],
  [/minus/g, '-'],
];

function evaluateExpression(input: string): number | null {
  let expression = input.toLowerCase().replace(/,/g, '');
  for (const [pattern, replacement] of OPERATOR_WORDS) {
    expression = expression.replace(pattern, replacement);
  }
  expression = expression.replace(/\bx\b/g, '*').trim();

  if (!/^[\d+\-*/().\s]+$/.test(expression)) return null;

  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+|[()+\-*/])/g) ?? [];
  if (tokens.join('') !== expression.replace(/\s+/g, '')) return null;

  let index = 0;

  const parsePrimary = (): number | null => {
    const token = tokens[index];
    if (token === undefined) return null;

    if (token === '+' || token === '-') {
      index += 1;
      const value = parsePrimary();
      if (value === null) return null;
      return token === '-' ? -value : value;
    }

    if (token === '(') {
      index += 1;
      const value = parseAdditive();
      if (tokens[index] !== ')') return null;
      index += 1;
      return value;
    }

    if (!/^\d/.test(token) && !token.startsWith('.')) return null;
    index += 1;
    return Number(token);
  };

  const parseMultiplicative = (): number | null => {
    let value = parsePrimary();
    if (value === null) return null;

    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index];
      index += 1;
      const next = parsePrimary();
      if (next === null || (operator === '/' && next === 0)) return null;
      value = operator === '*' ? value * next : value / next;
    }

    return value;
  };

  const parseAdditive = (): number | null => {
    let value = parseMultiplicative();
    if (value === null) return null;

    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index];
      index += 1;
      const next = parseMultiplicative();
      if (next === null) return null;
      value = operator === '+' ? value + next : value - next;
    }

    return value;
  };

  const result = parseAdditive();
  return index === tokens.length && result !== null && Number.isFinite(result) ? result : null;
}

export function tryCalculator(command: string): SkillResult | null {
  const match = command.match(/^(?:calculate|compute|what is)\s+(.+)$/i);
  if (!match) return null;

  const result = evaluateExpression(match[1]);
  if (result === null) {
    return {
      skill: 'calculator',
      response: 'I could not parse that calculation. Try something like “Calculate 25 times 18”.',
    };
  }

  return {
    skill: 'calculator',
    response: `The answer is ${Number.isInteger(result) ? result : result.toFixed(2).replace(/\.?0+$/, '')}.`,
  };
}