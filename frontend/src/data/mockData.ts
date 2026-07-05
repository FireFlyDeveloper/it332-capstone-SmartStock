import type { Product, Order, Delivery, User, Transaction, AIRecommendation } from '../types';

// Initial mock products for inventory
export const initialProducts: Product[] = [
  // Glass Products
  { id: '1', name: 'Clear Float Glass 4mm', category: 'glass', unit: 'sqm', stock: 150, price: 450, threshold: 50, status: 'active', sku: 'GL-001', description: 'Standard clear float glass 4mm thickness' },
  { id: '2', name: 'Clear Float Glass 6mm', category: 'glass', unit: 'sqm', stock: 200, price: 650, threshold: 50, status: 'active', sku: 'GL-002', description: 'Standard clear float glass 6mm thickness' },
  { id: '3', name: 'Clear Float Glass 8mm', category: 'glass', unit: 'sqm', stock: 80, price: 850, threshold: 50, status: 'active', sku: 'GL-003', description: 'Standard clear float glass 8mm thickness' },
  { id: '4', name: 'Tempered Glass 6mm', category: 'glass', unit: 'sqm', stock: 120, price: 1200, threshold: 40, status: 'active', sku: 'GL-004', description: 'Safety tempered glass 6mm' },
  { id: '5', name: 'Tempered Glass 10mm', category: 'glass', unit: 'sqm', stock: 60, price: 1800, threshold: 30, status: 'active', sku: 'GL-005', description: 'Safety tempered glass 10mm' },
  { id: '6', name: 'Frosted Glass 6mm', category: 'glass', unit: 'sqm', stock: 10, price: 950, threshold: 30, status: 'active', sku: 'GL-006', description: 'Frosted/etched glass for privacy' },
  { id: '7', name: 'Reflective Glass 6mm', category: 'glass', unit: 'sqm', stock: 90, price: 1100, threshold: 40, status: 'active', sku: 'GL-007', description: 'Heat reflective coated glass' },
  { id: '8', name: 'Laminated Glass 6mm', category: 'glass', unit: 'sqm', stock: 18, price: 1500, threshold: 25, status: 'active', sku: 'GL-008', description: 'Safety laminated glass' },
  { id: '9', name: 'Double Glazed Unit', category: 'glass', unit: 'unit', stock: 8, price: 2800, threshold: 20, status: 'active', sku: 'GL-009', description: 'Insulated glass unit' },
  { id: '10', name: 'Mirror 6mm', category: 'glass', unit: 'sqm', stock: 6, price: 800, threshold: 25, status: 'active', sku: 'GL-010', description: 'Silver mirror 6mm' },
  
  // Aluminum Products
  { id: '11', name: 'Aluminum Frame 2x4 inch', category: 'aluminum', unit: 'pcs', stock: 500, price: 180, threshold: 100, status: 'active', sku: 'AL-001', description: 'Standard aluminum frame' },
  { id: '12', name: 'Aluminum Frame 3x3 inch', category: 'aluminum', unit: 'pcs', stock: 350, price: 220, threshold: 80, status: 'active', sku: 'AL-002', description: 'Heavy duty aluminum frame' },
  { id: '13', name: 'Aluminum Channel', category: 'aluminum', unit: 'meter', stock: 800, price: 85, threshold: 150, status: 'active', sku: 'AL-003', description: 'Aluminum mounting channel' },
  { id: '14', name: 'Aluminum Sheet 1.5mm', category: 'aluminum', unit: 'sqm', stock: 45, price: 650, threshold: 30, status: 'active', sku: 'AL-004', description: 'Aluminum sheet 1.5mm thickness' },
  { id: '15', name: 'Aluminum Sheet 2mm', category: 'aluminum', unit: 'sqm', stock: 10, price: 850, threshold: 25, status: 'active', sku: 'AL-005', description: 'Aluminum sheet 2mm thickness' },
  { id: '16', name: 'Aluminum Tube Round', category: 'aluminum', unit: 'pcs', stock: 200, price: 250, threshold: 50, status: 'active', sku: 'AL-006', description: 'Round aluminum tube' },
  { id: '17', name: 'Aluminum Profile L-Shape', category: 'aluminum', unit: 'meter', stock: 120, price: 150, threshold: 40, status: 'active', sku: 'AL-007', description: 'L-shaped aluminum profile' },
  { id: '18', name: 'Aluminum Handle', category: 'aluminum', unit: 'pcs', stock: 20, price: 120, threshold: 30, status: 'active', sku: 'AL-008', description: 'Door/window aluminum handle' },
  { id: '19', name: 'Aluminum Hinge', category: 'aluminum', unit: 'pcs', stock: 150, price: 95, threshold: 40, status: 'active', sku: 'AL-009', description: 'Heavy duty aluminum hinge' },
  { id: '20', name: 'Aluminum Roller', category: 'aluminum', unit: 'pcs', stock: 12, price: 180, threshold: 30, status: 'active', sku: 'AL-010', description: 'Window/door roller' },
];

// Initial mock orders
export const initialOrders: Order[] = [
  {
    id: 'ORD-001',
    referenceNumber: 'SS-2026-00001',
    customerName: 'John Construction Corp',
    contact: '0912-345-6789',
    address: '123 Main St, Manila',
    items: [
      { productId: '1', productName: 'Clear Float Glass 4mm', quantity: 50, unitPrice: 450, total: 22500 },
      { productId: '4', productName: 'Tempered Glass 6mm', quantity: 30, unitPrice: 1200, total: 36000 }
    ],
    total: 58500,
    paidAmount: 58500,
    paymentStatus: 'paid',
    orderStatus: 'out_for_delivery',
    deliveryStatus: 'in_transit',
    orderType: 'delivery',
    date: '2026-03-20',
    createdAt: '2026-03-20T10:30:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-002',
    referenceNumber: 'SS-2026-00002',
    customerName: 'Elite Glass Works',
    contact: '0922-456-7890',
    address: '456 Commercial Ave, Quezon City',
    items: [
      { productId: '2', productName: 'Clear Float Glass 6mm', quantity: 80, unitPrice: 650, total: 52000 },
      { productId: '7', productName: 'Reflective Glass 6mm', quantity: 40, unitPrice: 1100, total: 44000 }
    ],
    total: 96000,
    paidAmount: 96000,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryStatus: 'delivered',
    orderType: 'delivery',
    date: '2026-03-18',
    createdAt: '2026-03-18T14:15:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-003',
    referenceNumber: 'SS-2026-00003',
    customerName: 'Metro Aluminum Supplies',
    contact: '0933-567-8901',
    address: '789 Industrial Blvd, Caloocan',
    items: [
      { productId: '11', productName: 'Aluminum Frame 2x4 inch', quantity: 100, unitPrice: 180, total: 18000 },
      { productId: '13', productName: 'Aluminum Channel', quantity: 50, unitPrice: 85, total: 4250 }
    ],
    total: 22250,
    paidAmount: 0,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    deliveryStatus: 'scheduled',
    orderType: 'delivery',
    date: '2026-03-22',
    createdAt: '2026-03-22T09:00:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-004',
    referenceNumber: 'SS-2026-00004',
    customerName: 'Sunrise Builders',
    contact: '0944-678-9012',
    address: '321 Residential Area, Pasay',
    items: [
      { productId: '3', productName: 'Clear Float Glass 8mm', quantity: 25, unitPrice: 850, total: 21250 },
      { productId: '5', productName: 'Tempered Glass 10mm', quantity: 15, unitPrice: 1800, total: 27000 }
    ],
    total: 48250,
    paidAmount: 25000,
    paymentStatus: 'partial',
    orderStatus: 'packed',
    deliveryStatus: 'scheduled',
    orderType: 'delivery',
    date: '2026-03-21',
    createdAt: '2026-03-21T16:45:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-005',
    referenceNumber: 'SS-2026-00005',
    customerName: 'ABC Glass Shop',
    contact: '0955-789-0123',
    address: '555 Shop Area, Makati',
    items: [
      { productId: '6', productName: 'Frosted Glass 6mm', quantity: 20, unitPrice: 950, total: 19000 }
    ],
    total: 19000,
    paidAmount: 19000,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryStatus: 'not_required',
    orderType: 'pickup',
    date: '2026-03-15',
    createdAt: '2026-03-15T11:20:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-006',
    referenceNumber: 'SS-2026-00006',
    customerName: 'Quick Fix Builders',
    contact: '0966-890-1234',
    address: '888 District, Parañaque',
    items: [
      { productId: '16', productName: 'Aluminum Tube Round', quantity: 30, unitPrice: 250, total: 7500 },
      { productId: '18', productName: 'Aluminum Handle', quantity: 50, unitPrice: 120, total: 6000 }
    ],
    total: 13500,
    paidAmount: 0,
    paymentStatus: 'pending',
    orderStatus: 'ready_for_pickup',
    deliveryStatus: 'not_required',
    orderType: 'pickup',
    date: '2026-03-22',
    createdAt: '2026-03-22T13:00:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-007',
    referenceNumber: 'SS-2025-00007',
    customerName: 'Megatower Construction',
    contact: '0977-901-2345',
    address: '100 Skyline Ave, Mandaluyong',
    items: [
      { productId: '1', productName: 'Clear Float Glass 4mm', quantity: 40, unitPrice: 450, total: 18000 },
      { productId: '5', productName: 'Tempered Glass 10mm', quantity: 20, unitPrice: 1800, total: 36000 }
    ],
    total: 54000,
    paidAmount: 54000,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryStatus: 'delivered',
    orderType: 'delivery',
    date: '2025-11-15',
    createdAt: '2025-11-15T08:30:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-008',
    referenceNumber: 'SS-2025-00008',
    customerName: 'Premier Aluminum Inc.',
    contact: '0988-012-3456',
    address: '200 Commerce St, Pasig',
    items: [
      { productId: '11', productName: 'Aluminum Frame 2x4 inch', quantity: 120, unitPrice: 180, total: 21600 },
      { productId: '13', productName: 'Aluminum Channel', quantity: 80, unitPrice: 85, total: 6800 },
      { productId: '17', productName: 'Aluminum Profile L-Shape', quantity: 60, unitPrice: 150, total: 9000 }
    ],
    total: 37400,
    paidAmount: 37400,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryStatus: 'delivered',
    orderType: 'delivery',
    date: '2025-12-08',
    createdAt: '2025-12-08T10:00:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-009',
    referenceNumber: 'SS-2026-00009',
    customerName: 'Allied Glass Supply',
    contact: '0999-123-4567',
    address: '350 Industrial Park, Valenzuela',
    items: [
      { productId: '8', productName: 'Laminated Glass 6mm', quantity: 25, unitPrice: 1500, total: 37500 },
      { productId: '6', productName: 'Frosted Glass 6mm', quantity: 15, unitPrice: 950, total: 14250 }
    ],
    total: 51750,
    paidAmount: 51750,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryStatus: 'delivered',
    orderType: 'delivery',
    date: '2026-01-20',
    createdAt: '2026-01-20T14:00:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-010',
    referenceNumber: 'SS-2026-00010',
    customerName: 'BuildRight Contractors',
    contact: '0911-234-5678',
    address: '500 Main Highway, San Juan',
    items: [
      { productId: '2', productName: 'Clear Float Glass 6mm', quantity: 60, unitPrice: 650, total: 39000 },
      { productId: '4', productName: 'Tempered Glass 6mm', quantity: 35, unitPrice: 1200, total: 42000 }
    ],
    total: 81000,
    paidAmount: 81000,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryStatus: 'delivered',
    orderType: 'delivery',
    date: '2026-02-10',
    createdAt: '2026-02-10T09:15:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-011',
    referenceNumber: 'SS-2026-00011',
    customerName: 'Metro Fabrication Co.',
    contact: '0922-345-6789',
    address: '675 Manufacturing Rd, Marikina',
    items: [
      { productId: '14', productName: 'Aluminum Sheet 1.5mm', quantity: 30, unitPrice: 650, total: 19500 },
      { productId: '16', productName: 'Aluminum Tube Round', quantity: 50, unitPrice: 250, total: 12500 }
    ],
    total: 32000,
    paidAmount: 32000,
    paymentStatus: 'paid',
    orderStatus: 'completed',
    deliveryStatus: 'delivered',
    orderType: 'delivery',
    date: '2026-02-25',
    createdAt: '2026-02-25T11:30:00',
    refundAmount: 0,
    refundStatus: 'none'
  },
  {
    id: 'ORD-012',
    referenceNumber: 'SS-2026-00012',
    customerName: 'National Glass Traders',
    contact: '0933-456-7890',
    address: '800 Logistics Hub, Laguna',
    items: [
      { productId: '7', productName: 'Reflective Glass 6mm', quantity: 30, unitPrice: 1100, total: 33000 },
      { productId: '9', productName: 'Double Glazed Unit', quantity: 10, unitPrice: 2800, total: 28000 }
    ],
    total: 61000,
    paidAmount: 30000,
    paymentStatus: 'partial',
    orderStatus: 'out_for_delivery',
    deliveryStatus: 'in_transit',
    orderType: 'delivery',
    date: '2026-03-28',
    createdAt: '2026-03-28T07:45:00',
    refundAmount: 0,
    refundStatus: 'none'
  }
];

// Initial mock deliveries
export const initialDeliveries: Delivery[] = [
  {
    id: 'DEL-001',
    orderId: 'ORD-001',
    driver: 'Carlos Mendoza',
    truckNumber: 'Truck-101',
    destination: '123 Main St, Manila',
    status: 'in_transit',
    location: 'EDSA, Quezon City',
    currentStep: 3,
    currentLocation: { x: 65, y: 40 },
    trafficLevel: 'medium',
    predictedDelay: false,
    routeEfficiencyScore: 85
  },
  {
    id: 'DEL-002',
    orderId: 'ORD-002',
    driver: 'Roberto Santos',
    truckNumber: 'Truck-103',
    destination: '456 Commercial Ave, Quezon City',
    status: 'delivered',
    location: 'Delivered',
    currentStep: 5,
    currentLocation: { x: 100, y: 100 },
    trafficLevel: 'low',
    predictedDelay: false,
    routeEfficiencyScore: 95
  },
  {
    id: 'DEL-003',
    orderId: 'ORD-003',
    driver: 'Pending',
    truckNumber: 'TBD',
    destination: '789 Industrial Blvd, Caloocan',
    status: 'pending',
    currentStep: 0,
    currentLocation: { x: 0, y: 0 },
    trafficLevel: 'low',
    predictedDelay: false,
    routeEfficiencyScore: 0
  },
  {
    id: 'DEL-004',
    orderId: 'ORD-004',
    driver: 'Juan Dela Cruz',
    truckNumber: 'Truck-105',
    destination: '321 Residential Area, Pasay',
    status: 'assigned',
    currentStep: 2,
    currentLocation: { x: 20, y: 25 },
    trafficLevel: 'high',
    predictedDelay: true,
    routeEfficiencyScore: 65
  },
  {
    id: 'DEL-005',
    orderId: 'ORD-005',
    driver: 'Maria Garcia',
    truckNumber: 'Truck-102',
    destination: '555 Makati Ave, Makati',
    status: 'in_transit',
    location: 'Ayala Ave, Makati',
    currentStep: 3,
    currentLocation: { x: 55, y: 55 },
    trafficLevel: 'medium',
    predictedDelay: false,
    routeEfficiencyScore: 88
  },
  {
    id: 'DEL-006',
    orderId: 'ORD-006',
    driver: 'Pedro Reyes',
    truckNumber: 'Truck-104',
    destination: '888 Ortigas Ave, Pasig',
    status: 'picked_up',
    currentStep: 2,
    currentLocation: { x: 35, y: 30 },
    trafficLevel: 'low',
    predictedDelay: false,
    routeEfficiencyScore: 90
  },
  {
    id: 'DEL-007',
    orderId: 'ORD-007',
    driver: 'Ana Santos',
    truckNumber: 'Truck-106',
    destination: '100 Skyline Ave, Mandaluyong',
    status: 'delivered',
    location: 'Delivered',
    currentStep: 5,
    currentLocation: { x: 100, y: 100 },
    trafficLevel: 'low',
    predictedDelay: false,
    routeEfficiencyScore: 97
  },
  {
    id: 'DEL-008',
    orderId: 'ORD-008',
    driver: 'Mario Cruz',
    truckNumber: 'Truck-107',
    destination: '200 Commerce St, Pasig',
    status: 'delivered',
    location: 'Delivered',
    currentStep: 5,
    currentLocation: { x: 100, y: 100 },
    trafficLevel: 'low',
    predictedDelay: false,
    routeEfficiencyScore: 92
  },
  {
    id: 'DEL-009',
    orderId: 'ORD-009',
    driver: 'Ramon Villanueva',
    truckNumber: 'Truck-108',
    destination: '350 Industrial Park, Valenzuela',
    status: 'delivered',
    location: 'Delivered',
    currentStep: 5,
    currentLocation: { x: 100, y: 100 },
    trafficLevel: 'medium',
    predictedDelay: false,
    routeEfficiencyScore: 88
  },
  {
    id: 'DEL-010',
    orderId: 'ORD-010',
    driver: 'Danny Garcia',
    truckNumber: 'Truck-109',
    destination: '500 Main Highway, San Juan',
    status: 'arrived',
    location: 'San Juan City Hall',
    currentStep: 4,
    currentLocation: { x: 90, y: 80 },
    trafficLevel: 'high',
    predictedDelay: true,
    routeEfficiencyScore: 78
  },
  {
    id: 'DEL-011',
    orderId: 'ORD-011',
    driver: 'Rico Martinez',
    truckNumber: 'Truck-110',
    destination: '675 Manufacturing Rd, Marikina',
    status: 'delivered',
    location: 'Delivered',
    currentStep: 5,
    currentLocation: { x: 100, y: 100 },
    trafficLevel: 'low',
    predictedDelay: false,
    routeEfficiencyScore: 94
  },
  {
    id: 'DEL-012',
    orderId: 'ORD-012',
    driver: 'Felipe Torres',
    truckNumber: 'Truck-111',
    destination: '800 Logistics Hub, Laguna',
    status: 'in_transit',
    location: 'SLEX, Alabang',
    currentStep: 3,
    currentLocation: { x: 60, y: 45 },
    trafficLevel: 'medium',
    predictedDelay: false,
    routeEfficiencyScore: 82
  }
];

// Initial mock users - solo account for capstone
export const initialUsers: User[] = [
  { id: '1', username: 'admin', role: 'admin', name: 'Administrator', password: 'admin123' }
];

// Analytics mock data
export const monthlySalesData = [
  { month: 'Sep 2025', sales: 185000, orders: 12 },
  { month: 'Oct 2025', sales: 210000, orders: 15 },
  { month: 'Nov 2025', sales: 195000, orders: 13 },
  { month: 'Dec 2025', sales: 280000, orders: 18 },
  { month: 'Jan 2026', sales: 245000, orders: 16 },
  { month: 'Feb 2026', sales: 320000, orders: 22 },
  { month: 'Mar 2026', sales: 290000, orders: 19 }
];

export const topItemsData = [
  { name: 'Clear Float Glass 6mm', quantity: 450, category: 'glass' },
  { name: 'Tempered Glass 6mm', quantity: 320, category: 'glass' },
  { name: 'Aluminum Frame 2x4 inch', quantity: 280, category: 'aluminum' },
  { name: 'Clear Float Glass 4mm', quantity: 250, category: 'glass' },
  { name: 'Aluminum Channel', quantity: 180, category: 'aluminum' }
];

export const fastMovingItems = [
  { name: 'Clear Float Glass 6mm', stock: 200, threshold: 50, status: 'healthy' },
  { name: 'Tempered Glass 6mm', stock: 120, threshold: 40, status: 'healthy' },
  { name: 'Aluminum Frame 2x4 inch', stock: 500, threshold: 100, status: 'healthy' }
];

export const slowMovingItems = [
  { name: 'Mirror 6mm', stock: 6, threshold: 25, status: 'critical' },
  { name: 'Double Glazed Unit', stock: 8, threshold: 20, status: 'critical' },
  { name: 'Frosted Glass 6mm', stock: 10, threshold: 30, status: 'critical' },
  { name: 'Aluminum Sheet 2mm', stock: 10, threshold: 25, status: 'critical' },
  { name: 'Aluminum Roller', stock: 12, threshold: 30, status: 'critical' }
];

// Transaction history
export const transactionHistory: Transaction[] = [
  { id: 'TXN-001', type: 'sale', reference: 'ORD-002', items: [{ name: 'Clear Float Glass 6mm', quantity: 80, amount: 52000 }, { name: 'Reflective Glass 6mm', quantity: 40, amount: 44000 }], total: 96000, date: '2026-03-18', status: 'completed' },
  { id: 'TXN-002', type: 'restock', reference: 'PO-023', items: [{ name: 'Clear Float Glass 4mm', quantity: 100, amount: 45000 }], total: 45000, date: '2026-03-17', status: 'completed' },
  { id: 'TXN-003', type: 'sale', reference: 'ORD-005', items: [{ name: 'Frosted Glass 6mm', quantity: 20, amount: 19000 }], total: 19000, date: '2026-03-15', status: 'completed' },
  { id: 'TXN-004', type: 'adjustment', reference: 'ADJ-005', items: [{ name: 'Aluminum Sheet 1.5mm', quantity: 5, amount: 3250 }], total: 3250, date: '2026-03-14', status: 'completed' },
  { id: 'TXN-005', type: 'return', reference: 'RET-002', items: [{ name: 'Aluminum Channel', quantity: 10, amount: 850 }], total: 850, date: '2026-03-12', status: 'completed' },
  { id: 'TXN-006', type: 'sale', reference: 'ORD-007', items: [{ name: 'Clear Float Glass 4mm', quantity: 40, amount: 18000 }, { name: 'Tempered Glass 10mm', quantity: 20, amount: 36000 }], total: 54000, date: '2025-11-15', status: 'completed' },
  { id: 'TXN-007', type: 'sale', reference: 'ORD-008', items: [{ name: 'Aluminum Frame 2x4 inch', quantity: 120, amount: 21600 }, { name: 'Aluminum Channel', quantity: 80, amount: 6800 }, { name: 'Aluminum Profile L-Shape', quantity: 60, amount: 9000 }], total: 37400, date: '2025-12-08', status: 'completed' },
  { id: 'TXN-008', type: 'sale', reference: 'ORD-009', items: [{ name: 'Laminated Glass 6mm', quantity: 25, amount: 37500 }, { name: 'Frosted Glass 6mm', quantity: 15, amount: 14250 }], total: 51750, date: '2026-01-20', status: 'completed' },
  { id: 'TXN-009', type: 'sale', reference: 'ORD-010', items: [{ name: 'Clear Float Glass 6mm', quantity: 60, amount: 39000 }, { name: 'Tempered Glass 6mm', quantity: 35, amount: 42000 }], total: 81000, date: '2026-02-10', status: 'completed' },
  { id: 'TXN-010', type: 'sale', reference: 'ORD-011', items: [{ name: 'Aluminum Sheet 1.5mm', quantity: 30, amount: 19500 }, { name: 'Aluminum Tube Round', quantity: 50, amount: 12500 }], total: 32000, date: '2026-02-25', status: 'completed' },
  { id: 'TXN-011', type: 'sale', reference: 'ORD-012', items: [{ name: 'Reflective Glass 6mm', quantity: 30, amount: 33000 }, { name: 'Double Glazed Unit', quantity: 10, amount: 28000 }], total: 61000, date: '2026-03-28', status: 'pending' }
];

// Mock AI Recommendations
export const mockAIRecommendations: AIRecommendation[] = [
  {
    id: 'rec-restock-mirror',
    type: 'restock',
    priority: 'high',
    title: 'Restock Mirror 6mm',
    description: 'AI predicts stockout in 5 days based on current demand of 3 units/week. Only 6 units remaining.',
    action: 'Order 15 units',
    estimatedImpact: 'Prevent ₱12,000 in lost sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-restock-dgu',
    type: 'restock',
    priority: 'high',
    title: 'Restock Double Glazed Unit',
    description: 'Stock critically low at 8 units. Average monthly demand is 20 units with increasing trend.',
    action: 'Order 24 units',
    estimatedImpact: 'Prevent ₱56,000 in lost sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-demand-frosted',
    type: 'demand',
    priority: 'medium',
    title: 'Increase Frosted Glass stock',
    description: 'AI detects 20% demand increase from 3 large orders this quarter. Recommended buffer.',
    action: 'Increase stock by 15 units',
    estimatedImpact: 'Capture ₱14,250 additional sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-demand-aluminum',
    type: 'demand',
    priority: 'medium',
    title: 'Increase Aluminum Sheet 2mm stock',
    description: 'AI detects 15% upward trend in aluminum orders. Only 10 sheets remaining.',
    action: 'Order 20 sheets',
    estimatedImpact: 'Capture ₱17,000 additional sales',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-pricing-high-demand',
    type: 'pricing',
    priority: 'low',
    title: 'Consider premium pricing for high-demand items',
    description: 'Reflective Glass, Laminated Glass, and Double Glazed Units showing sustained high demand.',
    action: 'Review pricing strategy',
    estimatedImpact: 'Potential 5-10% revenue increase',
    timestamp: new Date().toISOString()
  },
  {
    id: 'rec-restock-lam',
    type: 'restock',
    priority: 'low',
    title: 'Restock Laminated Glass 6mm',
    description: 'Current stock at 18 units. Predicted demand of 25 units for next month.',
    action: 'Order 20 units',
    estimatedImpact: 'Maintain healthy stock levels',
    timestamp: new Date().toISOString()
  }
];