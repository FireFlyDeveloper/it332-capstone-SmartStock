import React, { useMemo } from 'react';
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  Truck, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Brain,
  Zap
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { Layout } from '../components/Layout';
import { formatCurrency, getStatusColor, checkStockStatus } from '../utils/helpers';
import { generateDemandForecast, generateAIRecommendations, getAIInsights } from '../utils/aiHelpers';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { monthlySalesData, topItemsData } from '../data/mockData';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}> = ({ title, value, subtitle, icon: Icon, trend, trendValue, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const {
    products,
    orders,
    deliveries,
  } = useData();

  // Calculate stats
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock <= p.threshold).length;
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.orderStatus)).length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'completed').length;

  // Calculate stats
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  const pendingDeliveries = deliveries.filter(d => !['delivered', 'failed'].includes(d.status)).length;
  
  // Low stock alerts
  const lowStockProducts = products.filter(p => checkStockStatus(p.stock, p.threshold) !== 'healthy');
  
  // Recent orders
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Today's deliveries
  const todayDeliveries = deliveries.filter(d => 
    d.status !== 'delivered' && d.status !== 'failed'
  );

  // AI Predictions and Recommendations
  const aiForecasts = useMemo(() => generateDemandForecast(products, orders), [products, orders]);
  const aiRecommendations = useMemo(() => generateAIRecommendations(aiForecasts), [aiForecasts]);
  const aiInsights = useMemo(() => getAIInsights(aiForecasts, aiRecommendations), [aiForecasts, aiRecommendations]);

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Products"
            value={totalProducts}
            subtitle={`${products.filter(p => p.category === 'glass').length} Glass, ${products.filter(p => p.category === 'aluminum').length} Aluminum`}
            icon={Package}
            trend="up"
            trendValue="+5 this month"
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockItems}
            subtitle="Needs restocking"
            icon={AlertTriangle}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title="Active Orders"
            value={activeOrders}
            subtitle={`${pendingOrders} pending`}
            icon={ShoppingCart}
            color="bg-purple-100 text-purple-600"
          />
          <StatCard
            title="Delivered Orders"
            value={deliveredOrders}
            subtitle={`${pendingDeliveries} in transit`}
            icon={Truck}
            trend="up"
            trendValue="+12 this week"
            color="bg-green-100 text-green-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
                <p className="text-sm text-gray-500">Monthly revenue overview</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₱${value/1000}k`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Items Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Items</h3>
                <p className="text-sm text-gray-500">Most purchased products</p>
              </div>
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topItemsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Units Sold']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="quantity" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {topItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category === 'glass' ? '#0ea5e9' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
                <p className="text-sm text-gray-500">{lowStockProducts.length} items need attention</p>
              </div>
            </div>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 4).map((product) => {
                const status = checkStockStatus(product.stock, product.threshold);
                return (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                );
              })}
              {lowStockProducts.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No low stock items</p>
              )}
            </div>
          </div>

          {/* Pending Deliveries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pending Deliveries</h3>
                <p className="text-sm text-gray-500">{todayDeliveries.length} deliveries in progress</p>
              </div>
            </div>
            <div className="space-y-3">
              {todayDeliveries.slice(0, 4).map((delivery) => {
                const order = orders.find(o => o.id === delivery.orderId);
                return (
                  <div key={delivery.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{order?.customerName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{delivery.truckNumber} • {delivery.driver}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
              {todayDeliveries.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No pending deliveries</p>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <p className="text-sm text-gray-500">Latest transactions</p>
              </div>
            </div>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{order.customerName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Inventory Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-600 font-medium">Total SKUs</p>
              <p className="text-2xl font-bold text-blue-900">{totalProducts}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(totalInventoryValue)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-purple-600 font-medium">Glass Products</p>
              <p className="text-2xl font-bold text-purple-900">{products.filter(p => p.category === 'glass').length}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-orange-600 font-medium">Aluminum Products</p>
              <p className="text-2xl font-bold text-orange-900">{products.filter(p => p.category === 'aluminum').length}</p>
            </div>
          </div>
        </div>

        {/* AI-Powered Insights */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                AI-Powered Insights
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  aiInsights.alertLevel === 'high' ? 'bg-red-100 text-red-700' :
                  aiInsights.alertLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {aiInsights.alertLevel === 'high' ? '⚠️ Urgent' : aiInsights.alertLevel === 'medium' ? '⚡ Action Needed' : '✅ Normal'}
                </span>
              </h3>
              <p className="text-sm text-gray-600">{aiInsights.summary}</p>
            </div>
          </div>
          
          {/* AI Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiRecommendations.slice(0, 3).map((rec) => (
              <div key={rec.id} className="bg-white rounded-lg p-4 shadow-sm border border-violet-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {rec.type === 'restock' && <Package className="w-4 h-4 text-orange-500" />}
                    {rec.type === 'demand' && <TrendingUp className="w-4 h-4 text-green-500" />}
                    {rec.type === 'pricing' && <Zap className="w-4 h-4 text-purple-500" />}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{rec.title}</h4>
                <p className="text-xs text-gray-600 mb-2">{rec.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-violet-600 font-medium">{rec.action}</span>
                  <span className="text-gray-500">Impact: {rec.estimatedImpact}</span>
                </div>
              </div>
            ))}
            {aiRecommendations.length === 0 && (
              <div className="col-span-3 text-center py-4 text-gray-500">
                <Brain className="w-8 h-8 mx-auto mb-2 text-violet-300" />
                <p>AI analyzing your data...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};