import { describe, expect, it, vi } from 'vitest'
import { buildReportDocumentHtml, printReportDocument } from './reportDocument'

describe('buildReportDocumentHtml', () => {
  it('creates a standalone printable report with period, summary, and tabular sections', () => {
    const html = buildReportDocumentHtml({
      period: '2026-01-01 to 2026-01-31',
      generatedAt: '2026-02-01 09:00',
      summary: [['Orders', 3]],
      sections: [{ title: 'Inventory', columns: ['Product', 'Stock'], rows: [['Glass panel', 4]] }],
    })

    expect(html).toContain('<title>SmartStock Reports</title>')
    expect(html).toContain('2026-01-01 to 2026-01-31')
    expect(html).toContain('<th>Orders</th><td>3</td>')
    expect(html).toContain('<th>Product</th><th>Stock</th>')
    expect(html).toContain('table-layout:fixed')
    expect(html).not.toContain('<script>')
  })

  it('escapes report values before inserting them into the standalone document', () => {
    const html = buildReportDocumentHtml({
      period: '<script>alert(1)</script>', generatedAt: 'now', summary: [],
      sections: [{ title: 'Items', columns: ['Name'], rows: [['<img src=x onerror=alert(1)>']] }],
    })

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
  })
})

describe('printReportDocument', () => {
  it('prints from a hidden iframe without requiring a pop-up window', async () => {
    let afterPrint: EventListener = () => undefined
    const printWindow = {
      focus: vi.fn(),
      print: vi.fn(),
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        if (event === 'afterprint') afterPrint = listener
      }),
    }
    const frame = {
      title: '',
      tabIndex: 0,
      style: {},
      srcdoc: '',
      contentWindow: printWindow,
      setAttribute: vi.fn(),
      remove: vi.fn(),
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    } as unknown as HTMLIFrameElement
    const documentRef = {
      createElement: vi.fn(() => frame),
      body: { appendChild: vi.fn() },
    } as unknown as Document

    const printing = printReportDocument('<html><body>Report</body></html>', documentRef)
    expect(documentRef.body.appendChild).toHaveBeenCalledWith(frame)
    expect(frame.srcdoc).toContain('Report')
    frame.onload?.(new Event('load'))
    await printing

    expect(printWindow.focus).toHaveBeenCalledOnce()
    expect(printWindow.print).toHaveBeenCalledOnce()
    afterPrint(new Event('afterprint'))
    expect(frame.remove).toHaveBeenCalledOnce()
  })
})
