import React, { useMemo, useState } from 'react';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Truck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Database,
  Brain,
  Zap,
  X,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { formatCurrency, getStatusColor, checkStockStatus } from '../utils/helpers';
import { generateDemandForecast, generateAIRecommendations, getAIInsights } from '../utils/aiHelpers';
import { toast } from 'sonner';
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

const chartAccent = 'var(--accent)';
const chartGrid = 'var(--border)';
const chartMuted = 'var(--text-subtle)';

const shortenItemName = (name: string) => {
  return name
    .replace(/^Aluminum /, 'Alum. ')
    .replace(/^Clear Float Glass /, 'Float Glass ')
    .replace(/^Reflective Glass /, 'Reflective ')
    .replace(/^Tempered Glass /, 'Tempered ')
    .replace(/^Laminated Glass /, 'Laminated ')
    .replace(/ - Bronze Finish$/, ' · Bronze')
    .replace(/ - Matte Black$/, ' · Black')
    .replace(/ - White Powder Coat$/, ' · White')
    .replace(/Nylon Bearing/, 'Bearing')
    .replace(/Angle Bar/, 'Angle')
    .replace(/Profile /, 'Profile ');
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
}> = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => (
  <div className="metric-card p-5">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-semibold text-text-muted">{title}</p>
        <p className="text-3xl font-black tracking-tight text-text">{value}</p>
        {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trend === 'up' ? 'text-[var(--success)]' : 'text-danger'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="icon-tile h-11 w-11 shrink-0">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
    </div>
  </div>
);

const PanelHeading: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
}> = ({ title, subtitle, icon: Icon }) => (
  <div className="mb-5 flex items-center justify-between gap-4">
    <div>
      <h3 className="section-title text-lg">{title}</h3>
      {subtitle && <p className="section-subtitle text-sm">{subtitle}</p>}
    </div>
    {Icon && (
      <div className="icon-tile h-9 w-9">
        <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
      </div>
    )}
  </div>
);

export const Dashboard: React.FC = () => {
  const {
    products,
    orders,
    deliveries,
  } = useData();
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.stock <= p.threshold).length;
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.orderStatus)).length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'completed').length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  const pendingDeliveries = deliveries.filter(d => !['delivered', 'failed'].includes(d.status)).length;
  const lowStockProducts = products.filter(p => checkStockStatus(p.stock, p.threshold) !== 'healthy');
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const todayDeliveries = deliveries.filter(d =>
    d.status !== 'delivered' && d.status !== 'failed'
  );

  const topSellingChartData = useMemo(() => (
    topItemsData.slice(0, 8).map((item) => ({
      ...item,
      shortName: shortenItemName(item.name),
    }))
  ), []);

  const aiForecasts = useMemo(() => generateDemandForecast(products, orders), [products, orders]);
  const aiRecommendations = useMemo(() => generateAIRecommendations(aiForecasts), [aiForecasts]);
  const aiInsights = useMemo(() => getAIInsights(aiForecasts, aiRecommendations), [aiForecasts, aiRecommendations]);

  return (
    <div className="page-stack animate-fadeIn">
      <section className="panel overflow-hidden">
        <div className="grid gap-5 p-5 lg:grid-cols-[1.3fr_0.7fr] lg:p-6">
          <div className="space-y-3">
            <div className="chip w-fit">Operations dashboard</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-text sm:text-3xl">Glassram inventory control</h1>
              <p className="mt-2 max-w-2xl text-sm text-text-muted sm:text-base">
                Monitor stock pressure, order flow, deliveries, and backend-assisted recommendations from one operational view.
              </p>
            </div>
          </div>
          <div className="panel-muted grid grid-cols-2 gap-3 p-4">
            <div>
              <p className="text-xs font-semibold text-text-muted">Inventory value</p>
              <p className="mt-1 text-xl font-black text-text">{formatCurrency(totalInventoryValue)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-muted">Open deliveries</p>
              <p className="mt-1 text-xl font-black text-text">{pendingDeliveries}</p>
            </div>
            <div className="col-span-2 border-t border-border pt-3 text-xs text-text-muted">
              Local demo data remains clearly labeled until backend data is connected.
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showDemoBanner && (
          <div
            role="status"
            className="panel-muted flex items-start gap-3 px-4 py-3 text-text sm:flex-1"
          >
            <Database className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" strokeWidth={1.8} />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Demo build using local mock data.</p>
              <p className="text-xs text-text-muted">
                Dashboard numbers come from <code className="font-mono text-[11px]">mockData.ts</code> through the offline fallback.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDemoBanner(false)}
              aria-label="Dismiss demo banner"
              className="rounded-[var(--radius-input)] p-1 text-text-muted hover:bg-surface"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => toast.info('Demo data is static. No real date filtering applied.')}
          className="btn-secondary gap-2 self-start sm:self-auto"
        >
          <Clock className="h-3.5 w-3.5" />
          Last 30 days
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={totalProducts}
          subtitle={`${products.filter(p => p.category === 'glass').length} glass, ${products.filter(p => p.category === 'aluminum').length} aluminum`}
          icon={Package}
          trend="up"
          trendValue="+5 this month"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockItems}
          subtitle="Needs restocking"
          icon={AlertTriangle}
        />
        <StatCard
          title="Active Orders"
          value={activeOrders}
          subtitle={`${pendingOrders} pending`}
          icon={ShoppingCart}
        />
        <StatCard
          title="Delivered Orders"
          value={deliveredOrders}
          subtitle={`${pendingDeliveries} in transit`}
          icon={Truck}
          trend="up"
          trendValue="+12 this week"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="panel p-5">
          <PanelHeading title="Sales Trend" subtitle="Monthly revenue overview" icon={TrendingUp} />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlySalesData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartAccent} stopOpacity={0.26}/>
                  <stop offset="95%" stopColor={chartAccent} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis dataKey="month" stroke={chartMuted} fontSize={12} />
              <YAxis stroke={chartMuted} fontSize={12} tickFormatter={(value) => `₱${value/1000}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Sales']}
                contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', color: 'var(--text)' }}
              />
              <Area type="monotone" dataKey="sales" stroke={chartAccent} strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel p-5">
          <PanelHeading title="Top Selling Items" subtitle="Most purchased products" icon={Package} />
          <ResponsiveContainer width="100%" height={360}>
            <BarChart
              data={topSellingChartData}
              layout="vertical"
              margin={{ top: 4, right: 22, bottom: 10, left: 16 }}
              barCategoryGap={14}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGrid} />
              <XAxis
                type="number"
                stroke={chartMuted}
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                domain={[0, 'dataMax + 20']}
              />
              <YAxis
                dataKey="shortName"
                type="category"
                stroke="var(--text-muted)"
                fontSize={12}
                width={178}
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-muted)' }}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Units Sold']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                contentStyle={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', color: 'var(--text)' }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Bar dataKey="quantity" fill={chartAccent} radius={[0, 6, 6, 0]} barSize={18}>
                {topSellingChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.category === 'glass' ? 'var(--accent)' : 'var(--border-strong)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="panel p-5">
          <PanelHeading title="Low Stock Alerts" subtitle={`${lowStockProducts.length} items need attention`} icon={AlertTriangle} />
          <div className="space-y-3">
            {lowStockProducts.slice(0, 4).map((product) => {
              const status = checkStockStatus(product.stock, product.threshold);
              return (
                <div key={product.id} className="panel-muted flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{product.name}</p>
                    <p className="text-xs capitalize text-text-muted">{product.category}</p>
                  </div>
                  <span className={`rounded-[var(--radius-input)] px-2 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
                    {product.stock} left
                  </span>
                </div>
              );
            })}
            {lowStockProducts.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No low stock items</p>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <PanelHeading title="Pending Deliveries" subtitle={`${todayDeliveries.length} deliveries in progress`} icon={Truck} />
          <div className="space-y-3">
            {todayDeliveries.slice(0, 4).map((delivery) => {
              const order = orders.find(o => o.id === delivery.orderId);
              return (
                <div key={delivery.id} className="panel-muted flex items-center justify-between gap-3 p-3">
                  <div>
                    <p className="text-sm font-semibold text-text">{order?.customerName || 'Unassigned delivery'}</p>
                    <p className="text-xs text-text-muted">{delivery.truckNumber} / {delivery.driver}</p>
                  </div>
                  <span className={`rounded-[var(--radius-input)] px-2 py-1 text-xs font-semibold ${getStatusColor(delivery.status)}`}>
                    {delivery.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
            {todayDeliveries.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">No pending deliveries</p>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <PanelHeading title="Recent Orders" subtitle="Latest transactions" icon={ShoppingCart} />
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="panel-muted flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-semibold text-text">{order.customerName}</p>
                  <p className="flex items-center gap-1 text-xs text-text-muted">
                    <Clock className="h-3 w-3" />
                    {new Date(order.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-text">{formatCurrency(order.total)}</p>
                  <span className={`rounded-[var(--radius-input)] px-2 py-1 text-xs font-semibold ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <h3 className="section-title mb-5 text-lg">Inventory Summary</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel-muted p-4">
            <p className="text-sm font-semibold text-text-muted">Total SKUs</p>
            <p className="text-2xl font-black text-text">{totalProducts}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm font-semibold text-text-muted">Total Value</p>
            <p className="text-2xl font-black text-text">{formatCurrency(totalInventoryValue)}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm font-semibold text-text-muted">Glass Products</p>
            <p className="text-2xl font-black text-text">{products.filter(p => p.category === 'glass').length}</p>
          </div>
          <div className="panel-muted p-4">
            <p className="text-sm font-semibold text-text-muted">Aluminum Products</p>
            <p className="text-2xl font-black text-text">{products.filter(p => p.category === 'aluminum').length}</p>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="icon-tile h-10 w-10 shrink-0">
              <Brain className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <h3 className="section-title flex flex-wrap items-center gap-2 text-lg">
                Assisted Insights
                <span className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-xs font-semibold ${
                  aiInsights.alertLevel === 'high' ? 'bg-danger-soft text-danger' :
                  aiInsights.alertLevel === 'medium' ? 'bg-accent-soft text-accent' :
                  'bg-[var(--success-soft)] text-[var(--success)]'
                }`}>
                  {aiInsights.alertLevel === 'high' ? 'Urgent' : aiInsights.alertLevel === 'medium' ? 'Action needed' : 'Normal'}
                </span>
              </h3>
              <p className="text-sm text-text-muted">{aiInsights.summary}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {aiRecommendations.slice(0, 3).map((rec) => (
            <div key={rec.id} className="panel-muted p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-accent">
                  {rec.type === 'restock' && <Package className="h-4 w-4" />}
                  {rec.type === 'demand' && <TrendingUp className="h-4 w-4" />}
                  {rec.type === 'pricing' && <Zap className="h-4 w-4" />}
                </div>
                <span className={`rounded-[var(--radius-input)] px-2 py-0.5 text-xs font-semibold ${
                  rec.priority === 'high' ? 'bg-danger-soft text-danger' :
                  rec.priority === 'medium' ? 'bg-accent-soft text-accent' :
                  'bg-surface text-text-muted'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <h4 className="mb-1 text-sm font-bold text-text">{rec.title}</h4>
              <p className="mb-3 text-xs text-text-muted">{rec.description}</p>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-accent">{rec.action}</span>
                <span className="text-text-muted">Impact: {rec.estimatedImpact}</span>
              </div>
            </div>
          ))}
          {aiRecommendations.length === 0 && (
            <div className="col-span-full py-4 text-center text-text-muted">
              <Brain className="mx-auto mb-2 h-8 w-8 text-text-subtle" />
              <p>Analyzing dashboard data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
