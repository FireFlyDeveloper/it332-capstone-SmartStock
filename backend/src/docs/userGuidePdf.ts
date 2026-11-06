export type GuideBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list-item'; ordered: boolean; text: string }
  | { kind: 'callout'; text: string };

export function parseGuideMarkdown(markdown: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  const paragraphLines: string[] = [];
  const calloutLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ kind: 'paragraph', text: paragraphLines.join(' ') });
      paragraphLines.length = 0;
    }
  };
  const flushCallout = () => {
    if (calloutLines.length > 0) {
      blocks.push({ kind: 'callout', text: calloutLines.join(' ') });
      calloutLines.length = 0;
    }
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushCallout();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushCallout();
      blocks.push({ kind: 'heading', level: heading[1]!.length as 1 | 2 | 3, text: heading[2]!.trim() });
      continue;
    }

    const callout = /^>\s?(.*)$/.exec(line);
    if (callout) {
      flushParagraph();
      calloutLines.push(callout[1]!.trim());
      continue;
    }
    flushCallout();

    const unorderedItem = /^[-*+]\s+(.+)$/.exec(line);
    if (unorderedItem) {
      flushParagraph();
      blocks.push({ kind: 'list-item', ordered: false, text: unorderedItem[1]!.trim() });
      continue;
    }

    const orderedItem = /^\d+[.)]\s+(.+)$/.exec(line);
    if (orderedItem) {
      flushParagraph();
      blocks.push({ kind: 'list-item', ordered: true, text: orderedItem[1]!.trim() });
      continue;
    }

    if (/^(?:\||```|~~~|(?:-{3,}|\*{3,}|_{3,})$)/.test(line)
      || /^[-*+]\s*$/.test(line)
      || /^\d+[.)]\s*$/.test(line)
      || /(?:\*\*|__|`|!\[|\]\()/.test(line)) {
      throw new Error(`Unsupported Markdown block: ${line}`);
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushCallout();
  return blocks;
}
