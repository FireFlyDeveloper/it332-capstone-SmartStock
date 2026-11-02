export interface DailySalesOrder {
  id: string;
  referenceNumber: string;
  customerName: string;
  items: { productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  total: number;
  paidAmount: number;
  refundedAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  orderStatus: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface DailySalesSummary {
  date: string;
  recordedOrderCount: number;
  orderCount: number;
  cancelledOrderCount: number;
  statusCounts: { processing: number; inTransit: number; delivered: number; cancelled: number };
  paymentCounts: { paid: number; partial: number; unpaid: number; refunded: number };
  grossSales: number;
  collectedAmount: number;
  refundsAmount: number;
  netCollectedAmount: number;
  orders: DailySalesOrder[];
  page: {
    limit: number;
    totalCount: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}
