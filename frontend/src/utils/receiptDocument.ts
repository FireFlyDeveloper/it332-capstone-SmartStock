import type { Order } from '../types';
import { formatCurrency } from './helpers';

const escapeHtml = (value: string | number | null | undefined): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function formatReceiptDate(value: string, includeTime = false): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function formatStatus(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildOrderReceiptHtml(order: Order): string {
  const itemRows = order.items.length
    ? order.items.map((item) => `<tr>
        <td class="description">${escapeHtml(item.productName)}</td>
        <td class="number">${escapeHtml(formatCurrency(item.unitPrice))}</td>
        <td class="number">${escapeHtml(item.quantity)}</td>
        <td class="number">${escapeHtml(formatCurrency(item.total))}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="empty">No line items recorded.</td></tr>';
  const balance = Math.max(0, order.total - order.paidAmount);
  const address = order.address.trim();
  const notes = order.notes?.trim();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Receipt ${escapeHtml(order.referenceNumber)}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#172033;font:14px/1.5 Arial,sans-serif}
    .receipt{max-width:780px;margin:32px auto;padding:40px;background:#fff;border:1px solid #dbe2ea}
    .brand{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#52627a}
    header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid #233a72;padding-bottom:22px}
    h1{font-size:28px;line-height:1.1;margin:7px 0 0;color:#172554}.reference{text-align:right;color:#475569}
    .reference strong{display:block;font-size:18px;color:#172033}.meta{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0}
    .meta-card{border:1px solid #dbe2ea;border-radius:8px;padding:14px}.label{display:block;margin-bottom:4px;color:#64748b;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
    .value{font-weight:600;overflow-wrap:anywhere}.muted{color:#64748b;font-weight:400}.items{width:100%;border-collapse:collapse;margin-top:12px;table-layout:fixed}
    th,td{padding:11px 9px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:top;overflow-wrap:anywhere}
    thead th{background:#f8fafc;color:#475569;font-size:10px;letter-spacing:.07em;text-transform:uppercase}
    .items .number{text-align:right;white-space:nowrap}.items .description{width:46%}.items .empty{text-align:center;color:#64748b;padding:24px}
    .totals{width:min(100%,360px);margin:20px 0 0 auto}.total-row{display:flex;justify-content:space-between;gap:24px;padding:6px 0;color:#475569}
    .total-row strong{color:#172033;white-space:nowrap}.total-row.grand{border-top:2px solid #233a72;margin-top:6px;padding-top:12px;font-size:18px;font-weight:700;color:#172554}
    .balance{margin-top:18px;border-radius:8px;padding:14px;background:#f8fafc}.balance-row{display:flex;justify-content:space-between;gap:24px;margin-top:6px}
    .status{display:inline-block;border-radius:999px;background:#eef2ff;color:#3730a3;padding:3px 10px;font-size:12px;font-weight:700;text-transform:capitalize}
    .notes{margin-top:22px;padding:14px;border-left:3px solid #cbd5e1;background:#f8fafc;overflow-wrap:anywhere}
    .signatures{display:grid;grid-template-columns:1fr 1fr;gap:38px;margin-top:52px}.signature{border-top:1px solid #94a3b8;padding-top:7px;color:#64748b;font-size:11px}
    footer{border-top:1px solid #e2e8f0;margin-top:28px;padding-top:12px;color:#64748b;font-size:10px;text-align:center}
    @page{size:A4 portrait;margin:12mm}@media print{body{background:#fff}.receipt{max-width:none;margin:0;padding:0;border:0}.meta-card{break-inside:avoid}thead{display:table-header-group}tr{break-inside:avoid;page-break-inside:avoid}footer{position:static}}
    @media screen and (max-width:640px){.receipt{margin:0;padding:22px;border:0}.meta{grid-template-columns:1fr}.signatures{gap:20px}header{flex-direction:column}.reference{text-align:left}}
  </style>
</head>
<body>
  <main class="receipt">
    <header>
      <div><div class="brand">SmartStock · Glassram Glass and Aluminum Supply</div><h1>Order Receipt</h1></div>
      <div class="reference"><span class="label">Receipt / Order No.</span><strong>${escapeHtml(order.referenceNumber)}</strong><span>${escapeHtml(formatReceiptDate(order.createdAt, true))}</span></div>
    </header>
    <section class="meta" aria-label="Order information">
      <div class="meta-card"><span class="label">Customer</span><div class="value">${escapeHtml(order.customerName)}</div>${order.contact ? `<div class="muted">${escapeHtml(order.contact)}</div>` : ''}</div>
      <div class="meta-card"><span class="label">Fulfillment</span><div class="value">${escapeHtml(formatStatus(order.orderType))}</div>${order.date ? `<div class="muted">Scheduled: ${escapeHtml(formatReceiptDate(order.date))}</div>` : ''}</div>
      ${address ? `<div class="meta-card"><span class="label">Address / Pickup</span><div class="value">${escapeHtml(address)}</div></div>` : ''}
      <div class="meta-card"><span class="label">Order status</span><div class="value">${escapeHtml(formatStatus(order.orderStatus))}</div></div>
    </section>
    <section aria-label="Purchased items">
      <span class="label">Items</span>
      <table class="items"><thead><tr><th class="description">Description</th><th class="number">Unit price</th><th class="number">Qty</th><th class="number">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
    </section>
    <section class="totals" aria-label="Payment totals">
      <div class="total-row grand"><span>Order total</span><strong>${escapeHtml(formatCurrency(order.total))}</strong></div>
      <div class="balance">
        <div class="balance-row"><span>Paid</span><strong>${escapeHtml(formatCurrency(order.paidAmount))}</strong></div>
        <div class="balance-row"><span>Balance</span><strong>${escapeHtml(formatCurrency(balance))}</strong></div>
        ${order.refundAmount > 0 ? `<div class="balance-row"><span>Refunded</span><strong>${escapeHtml(formatCurrency(order.refundAmount))}</strong></div>` : ''}
        <div class="balance-row"><span>Payment status</span><span class="status">${escapeHtml(formatStatus(order.paymentStatus))}</span></div>
      </div>
    </section>
    ${notes ? `<section class="notes"><span class="label">Notes</span>${escapeHtml(notes)}</section>` : ''}
    <section class="signatures" aria-label="Receipt signatures"><div class="signature">Prepared by</div><div class="signature">Customer signature</div></section>
    <footer>Thank you for your business. Please keep this receipt for your records.</footer>
  </main>
</body>
</html>`;
}
