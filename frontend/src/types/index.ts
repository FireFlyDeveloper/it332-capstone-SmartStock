// Domain types — mirrored from the Capstone frontend, lightly normalized for
// the Hono backend. The backend is expected to return these shapes from the
// /products, /orders, /deliveries, /reports, /analytics endpoints.
//
// Last touched: 2026-07-07

export interface Product {
  id: string;
  name: string;
  category: 'glass' | 'aluminum';
  unit: string;
  stock: number;
  price: number;
  threshold: number;
  status: 'active' | 'discontinued';
  description?: string;
  sku: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus =
  | 'pending'
  | 'ready_for_pickup'
  | 'packed'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type DeliveryStatus = 'not_required' | 'scheduled' | 'in_transit' | 'delivered';
export type OrderType = 'pickup' | 'delivery';
export type RefundStatus = 'none' | 'requested' | 'completed';

export interface Order {
  id: string;
  referenceNumber: string;
  customerName: string;
  contact: string;
  address: string;
  items: OrderItem[];
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryStatus: DeliveryStatus;
  orderType: OrderType;
  date: string;
  createdAt: string;
  notes?: string;
  refundAmount: number;
  refundStatus: RefundStatus;
  refundReason?: string;
}

export interface DeliveryLocation {
  x: number;
  y: number;
}

export type DeliveryStatusFlow =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed';

export interface Delivery {
  id: string;
  orderId: string;
  driver: string;
  truckNumber: string;
  destination: string;
  status: DeliveryStatusFlow;
  location?: string;
  currentStep: number;
  currentLocation: DeliveryLocation;
  trafficLevel: 'low' | 'medium' | 'high';
  predictedDelay: boolean;
  routeEfficiencyScore: number;
  notes?: string;
}

// Analytics / reports shapes. Backend may return any of these from
// /reports or /analytics/* endpoints; we default to empty when missing.
export interface MonthlySales {
  month: string;
  sales: number;
  orders: number;
}

export interface TopItem {
  name: string;
  quantity: number;
  category: string;
}

export interface InventoryMovement {
  productId: string;
  productName: string;
  category: string;
  inward: number;
  outward: number;
  balance: number;
}

// Domain User — note: the Capstone shape uses { id, username, role, name, password? }.
// The IT332 AuthContext (do-not-touch) uses { id, email, name, role }. We keep the
// Capstone shape here for type compatibility with the orders/products imports in
// the original page code, and the IT332 AuthContext owns the auth User type.
export interface User {
  id: string;
  username: string;
  role: 'admin' | 'staff';
  name: string;
  password?: string;
}

export interface Transaction {
  id: string;
  type: 'sale' | 'restock' | 'return' | 'adjustment';
  reference: string;
  items: { name: string; quantity: number; amount: number }[];
  total: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

// AI types
export interface DemandForecast {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  daysUntilStockout: number;
  recommendedReorderQty: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DeliveryPrediction {
  deliveryId: string;
  predictedArrival: string;
  confidence: number;
  factors: string[];
}

export interface AIRecommendation {
  id: string;
  type: 'restock' | 'pricing' | 'delivery' | 'demand';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  estimatedImpact: string;
  timestamp: string;
}
