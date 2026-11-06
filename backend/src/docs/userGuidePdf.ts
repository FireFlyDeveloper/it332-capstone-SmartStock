import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import PDFDocument from 'pdfkit';

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

export async function renderGuidePdf(markdown: string): Promise<Buffer> {
  const blocks = parseGuideMarkdown(markdown);
  if (blocks.length === 0) throw new Error('The user guide is empty.');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, bottom: 54, left: 56, right: 56 },
      bufferPages: true,
      info: {
        Title: 'SmartStock User Guide',
        Author: 'SmartStock',
        Subject: 'User instructions for SmartStock staff, administrators, and customers',
      },
    });
    const chunks: Buffer[] = [];
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const contentBottom = doc.page.height - doc.page.margins.bottom - 34;
    let previousList: { ordered: boolean; index: number } | null = null;

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    for (const block of blocks) {
      if (block.kind === 'heading') {
        previousList = null;
        const size = block.level === 1 ? 23 : block.level === 2 ? 16 : 12;
        const gap = block.level === 1 ? 13 : block.level === 2 ? 10 : 7;
        doc.moveDown(block.level === 1 && doc.y === doc.page.margins.top ? 0 : 0.45);
        doc.font('Helvetica-Bold')
          .fontSize(size)
          .fillColor(block.level === 1 ? '#312e81' : '#1e293b');
        const height = doc.heightOfString(block.text, { width: contentWidth, lineGap: 2 });
        if (doc.y + height + gap > contentBottom) doc.addPage();
        doc.text(block.text, { width: contentWidth, lineGap: 2 });
        doc.moveDown(gap / 12);
        continue;
      }

      if (block.kind === 'paragraph') {
        previousList = null;
        doc.font('Helvetica').fontSize(10.5).fillColor('#334155');
        const height = doc.heightOfString(block.text, { width: contentWidth, lineGap: 3, paragraphGap: 5 });
        if (doc.y + height > contentBottom) doc.addPage();
        doc.text(block.text, { width: contentWidth, lineGap: 3, paragraphGap: 5 });
        doc.moveDown(0.35);
        continue;
      }

      if (block.kind === 'list-item') {
        const index: number = previousList?.ordered === block.ordered ? previousList.index + 1 : 1;
        previousList = { ordered: block.ordered, index };
        const prefix = block.ordered ? `${index}. ` : '- ';
        doc.font('Helvetica').fontSize(10.5).fillColor('#334155');
        const height = doc.heightOfString(`${prefix}${block.text}`, { width: contentWidth, indent: 18, lineGap: 2 });
        if (doc.y + height > contentBottom) doc.addPage();
        doc.text(`${prefix}${block.text}`, { width: contentWidth, indent: 18, lineGap: 2 });
        doc.moveDown(0.18);
        continue;
      }

      previousList = null;
      doc.font('Helvetica').fontSize(10).fillColor('#3730a3');
      const innerWidth = contentWidth - 24;
      const calloutHeight = doc.heightOfString(block.text, { width: innerWidth, lineGap: 2 }) + 18;
      if (doc.y + calloutHeight > contentBottom) doc.addPage();
      const calloutY = doc.y;
      doc.roundedRect(doc.page.margins.left, calloutY, contentWidth, calloutHeight, 5)
        .fillAndStroke('#eef2ff', '#c7d2fe');
      doc.fillColor('#3730a3');
      doc.text(block.text, doc.page.margins.left + 12, calloutY + 9, { width: innerWidth, lineGap: 2 });
      doc.y = calloutY + calloutHeight + 10;
    }

    const generatedAt = new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date());
    const pageRange = doc.bufferedPageRange();
    for (let index = pageRange.start; index < pageRange.start + pageRange.count; index += 1) {
      doc.switchToPage(index);
      doc.font('Helvetica').fontSize(8).fillColor('#64748b');
      doc.text(`SmartStock User Guide | Generated ${generatedAt}`, doc.page.margins.left, doc.page.height - doc.page.margins.bottom - 22, {
        width: contentWidth - 50,
        lineBreak: false,
      });
      doc.text(`Page ${index + 1}`, doc.page.width - doc.page.margins.right - 45, doc.page.height - doc.page.margins.bottom - 22, {
        width: 45,
        align: 'right',
        lineBreak: false,
      });
    }
    doc.end();
  });
}

export async function writeGuidePdf(inputPath: string, outputPath: string): Promise<void> {
  const markdown = await readFile(inputPath, 'utf8');
  const pdf = await renderGuidePdf(markdown);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, pdf);
}
