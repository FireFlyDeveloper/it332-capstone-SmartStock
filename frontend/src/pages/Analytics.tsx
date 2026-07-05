import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  Sparkles,
  Brain,
  TrendingDown,
  Minus,
  Zap
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { Layout } from '../components/Layout';
import { formatCurrency, checkStockStatus } from '../utils/helpers';
import { generateDemandForecast } from '../utils/aiHelpers';
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
  Cell,
  PieChart as RechartsPieChart,
  Pie
} from 'recharts';
import { 
  monthlySalesData, 
  topItemsData, 
  fastMovingItems, 
  slowMovingItems,
  mockAIRecommendations 
} from '../data/mockData';

export const Analytics: React.FC = () => {
  const { products, orders } = useData();

  // AI Demand Forecasting
  const aiForecasts = useMemo(() => generateDemandForecast(products, orders), [products, orders]);

  // Calculate inventory stats
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const glassProducts = products.filter(p => p.category === 'glass');
  const aluminumProducts = products.filter(p => p.category === 'aluminum');
  const glassValue = glassProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const aluminumValue = aluminumProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);

  // Stock status distribution for pie chart
  const stockDistribution = [
    { name: 'Healthy Stock', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'healthy').length, color: '#22c55e' },
    { name: 'Low Stock', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'low').length, color: '#eab308' },
    { name: 'Critical', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'critical').length, color: '#ef4444' },
    { name: 'Out of Stock', value: products.filter(p => p.stock === 0).length, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // Calculate inventory movements (mock calculation based on orders)
  const inventoryMovements = products.slice(0, 8).map(product => {
    const orderedQty = orders
      .filter(o => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => {
        const item = o.items.find(i => i.productId === product.id);
        return sum + (item?.quantity || 0);
      }, 0);
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      inward: Math.floor(Math.random() * 50) + 20,
      outward: orderedQty,
      balance: product.stock
    };
  });

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalInventoryValue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              <span>+8.2% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-blue-600">
              <ArrowUpRight className="w-4 h-4" />
              <span>+15% this month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              <span>+5% from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {products.filter(p => checkStockStatus(p.stock, p.threshold) !== 'healthy').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-yellow-600">
              <Clock className="w-4 h-4" />
              <span>Needs attention</span>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Sales Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Monthly Sales Trend</h3>
                <p className="text-sm text-gray-500">Revenue over time</p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="colorSales2" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per Month */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Orders per Month</h3>
                <p className="text-sm text-gray-500">Order volume tracking</p>
              </div>
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Orders']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Top Selling Items Annual</h3>
                <p className="text-sm text-gray-500">Annual most purchased materials</p>
              </div>
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topItemsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip formatter={(value: number) => [value, 'Units Sold']} />
                <Bar dataKey="quantity" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {topItemsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category === 'glass' ? '#0ea5e9' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Status Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Stock Status</h3>
                <p className="text-sm text-gray-500">Inventory health overview</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Value */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Category Value</h3>
                <p className="text-sm text-gray-500">Inventory by category</p>
              </div>
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Glass Products</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(glassValue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(glassValue / (glassValue + aluminumValue)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Aluminum Products</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(aluminumValue)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(aluminumValue / (glassValue + aluminumValue)) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Products</span>
                <span className="font-semibold text-gray-900">{products.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fast & Slow Moving Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fast Moving Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Fast Moving Items Monthly</h3>
                <p className="text-sm text-gray-500">Monthly high turnover products</p>
              </div>
            </div>
            <div className="space-y-3">
              {fastMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">{item.stock} in stock</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${item.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Moving Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Slow Moving Items</h3>
                <p className="text-sm text-gray-500">Low turnover products</p>
              </div>
            </div>
            <div className="space-y-3">
              {slowMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">{item.stock} in stock</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${item.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Movement Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inventory Movement Summary</h3>
              <p className="text-sm text-gray-500">Recent stock activity</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Inward</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Outward</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventoryMovements.map((item) => (
                  <tr key={item.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.productName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${item.category === 'glass' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600 font-medium">{item.inward}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-600 font-medium">{item.outward}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{item.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI-Powered Demand Forecasting */}
        <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Brain className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  AI Demand Forecasting
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">ML Powered</span>
                </h3>
                <p className="text-sm text-gray-600">Predicted demand based on historical patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span>Updated just now</span>
            </div>
          </div>
          
          {/* Demand Forecast Table */}
          <div className="bg-white rounded-lg overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-violet-50 border-b border-violet-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-violet-700 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-violet-700 uppercase">Current Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-violet-700 uppercase">Predicted Demand</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-violet-700 uppercase">Days Until Stockout</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-violet-700 uppercase">Recommended Reorder</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-violet-700 uppercase">Trend</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-violet-700 uppercase">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aiForecasts.slice(0, 6).map((forecast) => (
                  <tr key={forecast.productId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{forecast.productName}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{forecast.currentStock}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{forecast.predictedDemand}/mo</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        forecast.daysUntilStockout < 7 ? 'bg-red-100 text-red-700' :
                        forecast.daysUntilStockout < 14 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {forecast.daysUntilStockout > 0 ? `${forecast.daysUntilStockout} days` : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-violet-700">{forecast.recommendedReorderQty} units</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {forecast.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {forecast.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {forecast.trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                        <span className="text-xs capitalize text-gray-600">{forecast.trend}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-violet-500 h-2 rounded-full" 
                            style={{ width: `${forecast.confidence}%` }} 
                          />
                        </div>
                        <span className="text-xs text-gray-600">{forecast.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* AI Recommendations */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              AI Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockAIRecommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="bg-white rounded-lg p-3 border border-violet-100">
                  <div className="flex items-start justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rec.priority} priority
                    </span>
                    <span className="text-xs text-gray-500">{rec.type}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};