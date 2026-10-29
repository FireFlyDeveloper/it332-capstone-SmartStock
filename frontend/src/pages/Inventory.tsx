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
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { useAuth } from '../components/AuthContext';
import type { Product } from '../types';
import { formatCurrency, getStatusColor, checkStockStatus } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';

type ProductFormData = {
  name: string;
  sku: string;
  category: Product['category'] | '';
  unit: string;
  stock: string;
  price: string;
  threshold: string;
  status: Product['status'] | '';
  description: string;
};

const emptyProductForm: ProductFormData = {
  name: '',
  sku: '',
  category: '',
  unit: '',
  stock: '',
  price: '',
  threshold: '',
  status: '',
  description: '',
};

function toProductFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    unit: product.unit,
    stock: String(product.stock),
    price: String(product.price),
    threshold: String(product.threshold),
    status: product.status,
    description: product.description ?? '',
  };
}

function toProductPayload(form: ProductFormData): Omit<Product, 'id'> {
  const numericValues = [form.stock, form.price, form.threshold];
  if (!form.name.trim() || !form.sku.trim() || !form.category || !form.unit.trim() || !form.status ||
      numericValues.some((value) => value.trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0)) {
    throw new Error('Complete all required product fields with valid values.');
  }

  return {
    name: form.name.trim(),
    sku: form.sku.trim(),
    category: form.category,
    unit: form.unit.trim(),
    stock: Number(form.stock),
    price: Number(form.price),
    threshold: Number(form.threshold),
    status: form.status,
    description: form.description.trim(),
  };
}

export const Inventory: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct, loading } = useData();
  const { isAdmin } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'glass' | 'aluminum'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'healthy'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [purchaseUnitCost, setPurchaseUnitCost] = useState('');
  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

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
      setFormData(toProductFormData(product));
    } else {
      setEditingProduct(null);
      setFormData({ ...emptyProductForm });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ ...emptyProductForm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProduct) return;
    setSavingProduct(true);
    try {
      const payload = toProductPayload(formData);
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await addProduct(payload);
        toast.success('Product added successfully');
      }
      handleCloseModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleRestock = (productId: string) => {
    setRestockProductId(productId);
    setRestockQuantity(0);
    setPurchaseUnitCost('');
    setIsRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restockProductId && restockQuantity > 0) {
      try {
        await restockProduct(restockProductId, restockQuantity, purchaseUnitCost === '' ? undefined : Number(purchaseUnitCost));
        toast.success(`Restocked ${restockQuantity} units successfully`);
        setIsRestockModalOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not restock product.');
      }
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete product.');
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
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input !pl-10 w-full sm:w-64"
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
              className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            )}
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {statusPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStockFilter(pill.key)}
              className={`rounded-2xl px-4 py-1.5 text-xs font-bold transition-all ${
                stockFilter === pill.key
                  ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-900/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Total Products</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Glass Products</p>
            <p className="text-2xl font-black text-[#3b82f6] mt-1">{products.filter(p => p.category === 'glass').length}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Aluminum Profiles</p>
            <p className="text-2xl font-black text-[#10b981] mt-1">{products.filter(p => p.category === 'aluminum').length}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Low Stock</p>
            <p className="text-2xl font-black text-[#f43f5e] mt-1">{products.filter(p => checkStockStatus(p.stock, p.threshold) !== 'healthy').length}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const stockStatus = checkStockStatus(product.stock, product.threshold);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">{product.sku}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.unit}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                          product.category === 'glass' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{product.stock}</span>
                          <span className="text-gray-500 text-xs">{product.unit}</span>
                          <span className={`w-2 h-2 rounded-full ${
                            stockStatus === 'healthy' ? 'bg-green-500' :
                            stockStatus === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestock(product.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restock"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenModal(product)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDelete(product.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && !isEmpty && (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products match the current filters.</p>
            </div>
          )}

          {isEmpty && (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <PackagePlus className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No products yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                No products are available yet. Add a product from the inventory controls to begin.
              </p>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" /> Add your first product
                </button>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Ask an admin to add the first product.</p>
              )}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideIn">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData((current) => ({ ...current, name: e.target.value }))}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">SKU</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData((current) => ({ ...current, sku: e.target.value }))}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData((current) => ({ ...current, category: e.target.value as ProductFormData['category'] }))}
                      className="input"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="glass">Glass</option>
                      <option value="aluminum">Aluminum</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Unit</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData((current) => ({ ...current, unit: e.target.value }))}
                      className="input"
                      required
                    >
                      <option value="">Select unit</option>
                      {formData.unit && !['sqm', 'pcs', 'meter', 'unit', 'sheet', 'length'].includes(formData.unit) && (
                        <option value={formData.unit}>{formData.unit}</option>
                      )}
                      <option value="sqm">sqm</option>
                      <option value="pcs">pcs</option>
                      <option value="meter">meter</option>
                      <option value="unit">unit</option>
                      <option value="sheet">sheet</option>
                      <option value="length">length</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="label">Price (₱)</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={(e) => setFormData((current) => ({ ...current, price: e.target.value }))}
                      className="input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Initial Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={(e) => setFormData((current) => ({ ...current, stock: e.target.value }))}
                      className="input"
                      min="0"
                      step="any"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="label">Low Stock Threshold</label>
                    <input
                      type="number"
                      name="threshold"
                      value={formData.threshold}
                      onChange={(e) => setFormData((current) => ({ ...current, threshold: e.target.value }))}
                      className="input"
                      min="0"
                      step="any"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="label">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={(e) => setFormData((current) => ({ ...current, status: e.target.value as ProductFormData['status'] }))}
                      className="input"
                      required
                    >
                      <option value="">Select status</option>
                      <option value="active">Active</option>
                      <option value="discontinued">Discontinued</option>
                    </select>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="label">Description (Optional)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))}
                      className="input"
                      rows={2}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary" disabled={savingProduct}>
                    {savingProduct ? 'Saving…' : editingProduct ? 'Update' : 'Add'} Product
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
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Restock Product</h3>
                <button onClick={() => setIsRestockModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
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
                <div>
                  <label className="label">Purchase cost per unit (₱, optional)</label>
                  <input type="number" value={purchaseUnitCost} onChange={(e) => setPurchaseUnitCost(e.target.value)} className="input" min="0" step="0.01" placeholder="Leave blank if unknown" />
                  <p className="mt-1 text-xs text-slate-500">Recorded acquisition cost for this receipt; this is not the product selling price.</p>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Product?</h3>
                <p className="text-gray-500">This action cannot be undone. The product will be permanently removed.</p>
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