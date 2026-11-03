import { describe, expect, it } from 'vitest'
import { buildReportDocumentHtml } from './reportDocument'

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
    expect(html).toContain('window.print()')
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
