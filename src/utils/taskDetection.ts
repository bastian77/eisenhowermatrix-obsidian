export function hasOpenTask(markdown: string): boolean {
    return /(^|\r?\n)\s*(?:[-*+]|\d+[.)])\s+\[ \](?:\s|$)/m.test(markdown);
}
