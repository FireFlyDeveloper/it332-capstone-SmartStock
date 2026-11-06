import { describe, expect, it } from 'vitest';
import { renderGuidePdf, parseGuideMarkdown } from './userGuidePdf.js';

describe('parseGuideMarkdown', () => {
  it('preserves headings, paragraphs, and list items in order', () => {
    expect(parseGuideMarkdown('# Quick Start\n\nOpen SmartStock.\n\n- Sign in\n- Choose Dashboard')).toEqual([
      { kind: 'heading', level: 1, text: 'Quick Start' },
      { kind: 'paragraph', text: 'Open SmartStock.' },
      { kind: 'list-item', ordered: false, text: 'Sign in' },
      { kind: 'list-item', ordered: false, text: 'Choose Dashboard' },
    ]);
  });

  it('supports nested heading levels, ordered lists, and callouts', () => {
    expect(parseGuideMarkdown('## Orders\n\n1. Select New Order.\n2. Save it.\n\n> Check both order and payment status.')).toEqual([
      { kind: 'heading', level: 2, text: 'Orders' },
      { kind: 'list-item', ordered: true, text: 'Select New Order.' },
      { kind: 'list-item', ordered: true, text: 'Save it.' },
      { kind: 'callout', text: 'Check both order and payment status.' },
    ]);
  });

  it('joins wrapped paragraph lines and ignores blank input', () => {
    expect(parseGuideMarkdown('\nFirst line\nof one paragraph.\n\n')).toEqual([
      { kind: 'paragraph', text: 'First line of one paragraph.' },
    ]);
    expect(parseGuideMarkdown(' \n\t\n')).toEqual([]);
  });

  it('rejects unsupported Markdown blocks rather than dropping their content', () => {
    expect(() => parseGuideMarkdown('| Item | Action |\n| --- | --- |'))
      .toThrow(/Unsupported Markdown block/);
  });
});

describe('renderGuidePdf', () => {
  it('returns a PDF buffer for guide content', async () => {
    const pdf = await renderGuidePdf('# SmartStock User Guide\n\nSign in with your organization-issued account.');
    expect(pdf.subarray(0, 4).toString('ascii')).toBe('%PDF');
  });
});
