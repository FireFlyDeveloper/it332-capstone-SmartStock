import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Download,
  PackagePlus,
  History,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import type { Product, StockMovement } from '../types';
import { formatCurrency, getStatusColor, checkStockStatus } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';

const initialProductForm: Omit<Product, 'id'> = {
  name: '',
  category: 'glass',
  unit: 'sqm',
  stock: 0,
  price: 0,
  threshold: 10,
  status: 'active',
  sku: '',
  description: ''
};

export const Inventory: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct, listProductMovements, loading } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'glass' | 'aluminum'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'healthy'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(initialProductForm);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [movementsByProduct, setMovementsByProduct] = useState<Record<string, StockMovement[]>>({});
  const [movementsLoading, setMovementsLoading] = useState<string | null>(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const stockStatus = checkStockStatus(product.stock, product.threshold);
      const matchesStock = stockFilter === 'all' || stockFilter === stockStatus;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ ...initialProductForm, sku: `SKU-${Date.now().toString(36).toUpperCase()}` });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialProductForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success('Product updated successfully');
      } else {
        await addProduct(formData);
        toast.success('Product added successfully');
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const handleRestock = (productId: string) => {
    setRestockProductId(productId);
    setRestockQuantity(0);
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockProductId && restockQuantity > 0) {
      try {
        await restockProduct(restockProductId, restockQuantity);
        setMovementsByProduct((prev) => {
          const next = { ...prev };
          delete next[restockProductId];
          return next;
        });
        toast.success(`Restocked ${restockQuantity} units successfully`);
        setIsRestockModalOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to restock product');
      }
    }
  };

  const handleToggleMovements = async (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      return;
    }

    setExpandedProductId(productId);
    if (movementsByProduct[productId]) return;

    setMovementsLoading(productId);
    try {
      const movements = await listProductMovements(productId);
      setMovementsByProduct((prev) => ({ ...prev, [productId]: movements }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load movement history');
    } finally {
      setMovementsLoading(null);
    }
  };

  const handleDelete = (productId: string) => {
    setDeleteProductId(productId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteProductId) return;
    try {
      await deleteProduct(deleteProductId);
      toast.success('Product deleted successfully');
      setIsDeleteConfirmOpen(false);
      setDeleteProductId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleExportCSV = () => {
    const csv = toCSV(filteredProducts, [
      { key: 'sku', header: 'SKU' },
      { key: 'name', header: 'Product' },
      { key: 'category', header: 'Category' },
      { key: 'unit', header: 'Unit' },
      { key: 'stock', header: 'Stock' },
      { key: 'price', header: 'Price (PHP)' },
      { key: 'threshold', header: 'Reorder Threshold' },
      { key: 'status', header: 'Status' },
    ]);
    downloadCSV(`inventory-${new Date().toISOString().split('T')[0]}.csv`, csv);
    toast.success(`Exported ${filteredProducts.length} products to CSV`);
  };

  const statusPills: { key: typeof stockFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'low', label: 'Low Stock' },
    { key: 'healthy', label: 'In Stock' },
  ];

  const isEmpty = !loading && products.length === 0;

  return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
              className="input w-full sm:w-40"
            >
              <option value="all">All Categories</option>
              <option value="glass">Glass</option>
              <option value="aluminum">Aluminum</option>
            </select>
            
            {/* Stock Filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
              className="input w-full sm:w-40"
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="healthy">Healthy</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredProducts.length === 0}
              className="btn-secondary gap-2 self-start disabled:opacity-50 sm:self-auto"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {statusPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStockFilter(pill.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                stockFilter === pill.key
                  ? 'bg-accent text-accent-fg'
                  : 'bg-surface-2 text-text-muted hover:bg-[var(--surface-3)]'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">Total Products</p>
            <p className="text-2xl font-bold text-text">{products.length}</p>
          </div>
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">Glass Products</p>
            <p className="text-2xl font-bold text-accent">{products.filter(p => p.category === 'glass').length}</p>
          </div>
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">Aluminum Products</p>
            <p className="text-2xl font-bold text-[var(--success)]">{products.filter(p => p.category === 'aluminum').length}</p>
          </div>
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">Low Stock</p>
            <p className="text-2xl font-bold text-accent">{products.filter(p => checkStockStatus(p.stock, p.threshold) !== 'healthy').length}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const stockStatus = checkStockStatus(product.stock, product.threshold);
                  const movements = movementsByProduct[product.id] ?? [];
                  return (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-surface-2 transition-colors">
                        <td className="px-6 py-4 text-sm text-text-muted font-medium">{product.sku}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-text">{product.name}</p>
                            <p className="text-xs text-text-muted">{product.unit}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            product.category === 'glass' ? 'bg-accent-soft text-accent' : 'bg-[var(--success-soft)] text-[var(--success)]'
                          }`}>
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text">{product.stock}</span>
                            <span className="text-text-muted text-xs">{product.unit}</span>
                            <span className={`w-2 h-2 rounded-full ${
                              stockStatus === 'healthy' ? 'bg-[var(--success-soft)]0' :
                              stockStatus === 'low' ? 'bg-accent-soft0' : 'bg-red-500'
                            }`} />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-text">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleMovements(product.id)}
                              className="p-2 text-text-muted hover:bg-surface-2 rounded-lg transition-colors"
                              title="Movement history"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRestock(product.id)}
                              className="p-2 text-[var(--success)] hover:bg-[var(--success-soft)] rounded-lg transition-colors"
                              title="Restock"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(product)}
                              className="p-2 text-accent hover:bg-accent-soft rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedProductId === product.id && (
                        <tr className="bg-surface-2">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="rounded-lg border border-border bg-white p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-text">Movement history</h4>
                                <span className="text-xs text-text-muted">{movements.length} movement(s)</span>
                              </div>
                              {movementsLoading === product.id ? (
                                <p className="text-sm text-text-muted">Loading movements...</p>
                              ) : movements.length === 0 ? (
                                <p className="text-sm text-text-muted">No movements recorded yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {movements.map((movement) => (
                                    <div key={movement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-2 px-3 py-2 text-sm">
                                      <div>
                                        <span className={movement.type === 'inbound' ? 'font-semibold text-[var(--success)]' : 'font-semibold text-red-700'}>
                                          {movement.type === 'inbound' ? '+' : '-'}{movement.quantity}
                                        </span>
                                        <span className="ml-2 text-text-muted">{movement.referenceNo}</span>
                                        {movement.supplier && <span className="ml-2 text-text-muted">- {movement.supplier}</span>}
                                      </div>
                                      <span className="text-xs text-text-muted">{new Date(movement.occurredAt).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && !isEmpty && (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-text-subtle mx-auto mb-4" />
              <p className="text-text-muted">No products match the current filters.</p>
            </div>
          )}

          {isEmpty && (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <PackagePlus className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-text">No products yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
                Demo data will appear once the backend is connected. In the meantime, you can
                add a demo product below.
              </p>
              <button
                type="button"
                onClick={() => toast.info('Demo build - this would open the create form.')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
              >
                <Plus className="h-4 w-4" /> Add your first product
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideIn">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-xl font-semibold text-text">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-surface-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Product Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as 'glass' | 'aluminum' })}
                      className="input"
                    >
                      <option value="glass">Glass</option>
                      <option value="aluminum">Aluminum</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Unit</label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input"
                    >
                      <option value="sqm">sqm</option>
                      <option value="pcs">pcs</option>
                      <option value="meter">meter</option>
                      <option value="unit">unit</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Price (₱)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Initial Stock</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Low Stock Threshold</label>
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: Number(e.target.value) })}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="label">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'discontinued' })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="label">Description (Optional)</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    {editingProduct ? 'Update' : 'Add'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Restock Modal */}
        {isRestockModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md animate-slideIn">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-xl font-semibold text-text">Restock Product</h3>
                <button onClick={() => setIsRestockModalOpen(false)} className="p-2 hover:bg-surface-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleRestockSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label">Quantity to Add</label>
                  <input
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(Number(e.target.value))}
                    className="input"
                    min="1"
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsRestockModalOpen(false)} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Confirm Restock
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md animate-slideIn">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">Delete Product?</h3>
                <p className="text-text-muted">This action cannot be undone. The product will be permanently removed.</p>
              </div>
              
              <div className="flex gap-3 p-6 pt-0">
                <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};