import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { getProductsPage, type ProductsPageResponse } from '../api';
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

const PRODUCT_BATCH_SIZES = [10, 25, 50, 100] as const;

export const Inventory: React.FC = () => {
  const { addProduct, updateProduct, deleteProduct, restockProduct } = useData();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'glass' | 'aluminum'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'healthy'>('all');
  const [batchSize, setBatchSize] = useState<number>(25);
  const [pagedProducts, setPagedProducts] = useState<Product[]>([]);
  const [pageSummary, setPageSummary] = useState<ProductsPageResponse['summary']>({ totalProducts: 0, glassCount: 0, aluminumCount: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [pageTotalCount, setPageTotalCount] = useState(0);
  const [pageNextCursor, setPageNextCursor] = useState<string | null>(null);
  const [pageHasMore, setPageHasMore] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreError, setLoadingMoreError] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const requestGeneration = useRef(0);
  const loadingMoreRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [restockReferenceNo, setRestockReferenceNo] = useState('');
  const [restockSupplier, setRestockSupplier] = useState('');
  const [purchaseUnitCost, setPurchaseUnitCost] = useState('');
  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingRestock, setSavingRestock] = useState(false);

  const loadFirstPage = useCallback(async () => {
    const requestId = ++requestGeneration.current;
    loadingMoreRef.current = false;
    setPageLoading(true);
    setLoadingMore(false);
    setPageError('');
    setLoadingMoreError('');
    setPagedProducts([]);
    setPageNextCursor(null);
    setPageHasMore(false);
    setPageTotalCount(0);
    setPageSummary({ totalProducts: 0, glassCount: 0, aluminumCount: 0, lowStockCount: 0, outOfStockCount: 0 });
    try {
      const result = await getProductsPage({
        limit: batchSize,
        category: categoryFilter,
        stock: stockFilter,
        search: searchTerm,
      });
      if (requestId !== requestGeneration.current) return;
      setPagedProducts(result.items);
      setPageSummary(result.summary);
      setPageTotalCount(result.page.totalCount);
      setPageNextCursor(result.page.nextCursor);
      setPageHasMore(result.page.hasMore);
    } catch (error) {
      if (requestId === requestGeneration.current) setPageError(error instanceof Error ? error.message : 'Could not load inventory.');
    } finally {
      if (requestId === requestGeneration.current) setPageLoading(false);
    }
  }, [batchSize, categoryFilter, stockFilter, searchTerm]);

  useEffect(() => { void loadFirstPage() }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!pageHasMore || !pageNextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadingMoreError('');
    const requestId = requestGeneration.current;
    try {
      const result = await getProductsPage({
        limit: batchSize,
        cursor: pageNextCursor,
        category: categoryFilter,
        stock: stockFilter,
        search: searchTerm,
      });
      if (requestId !== requestGeneration.current) return;
      setPagedProducts((current) => [...current, ...result.items]);
      setPageNextCursor(result.page.nextCursor);
      setPageHasMore(result.page.hasMore);
      setPageTotalCount(result.page.totalCount);
      setPageSummary(result.summary);
    } catch (error) {
      if (requestId === requestGeneration.current) setLoadingMoreError(error instanceof Error ? error.message : 'Could not load more products.');
    } finally {
      if (requestId === requestGeneration.current) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  }, [batchSize, pageHasMore, pageNextCursor, categoryFilter, stockFilter, searchTerm]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !pageHasMore || pageLoading || loadingMore || loadingMoreError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: '240px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pageHasMore, pageLoading, loadingMore, loadingMoreError, loadMore]);

  const displayedStart = pagedProducts.length === 0 ? 0 : 1;
  const displayedEnd = pagedProducts.length;


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
      await loadFirstPage();
      handleCloseModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleRestock = (productId: string) => {
    setRestockProductId(productId);
    setRestockQuantity('');
    setRestockReferenceNo('');
    setRestockSupplier('');
    setPurchaseUnitCost('');
    setIsRestockModalOpen(true);
  };

  const handleCloseRestockModal = () => {
    setIsRestockModalOpen(false);
    setRestockProductId(null);
    setRestockQuantity('');
    setRestockReferenceNo('');
    setRestockSupplier('');
    setPurchaseUnitCost('');
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = Number(restockQuantity);
    const unitCost = purchaseUnitCost.trim() === '' ? undefined : Number(purchaseUnitCost);
    if (!restockProductId || restockQuantity.trim() === '' || !Number.isFinite(quantity) || quantity <= 0 || savingRestock) return;
    if (!restockReferenceNo.trim() || !restockSupplier.trim()) {
      toast.error('Enter the actual supplier and receipt or purchase-order reference.');
      return;
    }
    if (unitCost !== undefined && (!Number.isFinite(unitCost) || unitCost < 0)) {
      toast.error('Enter a valid purchase cost or leave it blank if unknown.');
      return;
    }

    setSavingRestock(true);
    try {
      await restockProduct(restockProductId, quantity, {
        referenceNo: restockReferenceNo.trim(),
        supplier: restockSupplier.trim(),
        ...(unitCost !== undefined ? { unitCost } : {}),
      });
      await loadFirstPage();
      toast.success(`Restocked ${quantity} units successfully`);
      handleCloseRestockModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not restock product.');
    } finally {
      setSavingRestock(false);
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
      await loadFirstPage();
      toast.success('Product deleted successfully');
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete product.');
    }
  };

  const handleExportCSV = async () => {
    setExportingCsv(true);
    try {
      const exportRows: Product[] = [];
      let cursor: string | null = null;
      do {
        const result = await getProductsPage({
          limit: 100,
          cursor,
          category: categoryFilter,
          stock: stockFilter,
          search: searchTerm,
        });
        exportRows.push(...result.items);
        cursor = result.page.nextCursor;
      } while (cursor);
      const csv = toCSV(exportRows, [
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
      toast.success(`Exported all ${exportRows.length} filtered products to CSV`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not export inventory.');
    } finally {
      setExportingCsv(false);
    }
  };

  const isEmpty = !pageLoading && !pageError && pageSummary.totalProducts === 0;

  if (pageLoading) {
    return <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading inventory data from backend…</div>;
  }
  if (pageError) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-semibold text-rose-700">Could not load inventory from backend: {pageError}</p>
        <button type="button" onClick={() => void loadFirstPage()} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="search"
                aria-label="Search by product name, SKU, category, unit, or description"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="input !pl-10 w-full sm:w-64"
              />
            </div>
            
            {/* Category Filter */}
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as typeof categoryFilter);
              }}
              className="input w-full sm:w-40"
            >
              <option value="all">All Categories</option>
              <option value="glass">Glass</option>
              <option value="aluminum">Aluminum</option>
            </select>
            
            {/* Stock Filter */}
            <select
              aria-label="Filter by stock status"
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as typeof stockFilter);
              }}
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
              disabled={pageTotalCount === 0 || exportingCsv}
              title="Exports all products matching the current filters, including rows not yet loaded by scrolling"
              aria-label="Export all filtered products to CSV"
              className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <Download className="h-4 w-4" /> {exportingCsv ? 'Exporting…' : 'Export CSV'}
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

        {/* Result count and infinite-scroll batch size */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600" aria-live="polite">
            {pageTotalCount} product{pageTotalCount === 1 ? '' : 's'} match the current filters
          </p>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            Load batch size
            <select
              aria-label="Infinite-scroll batch size"
              value={batchSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                setBatchSize(nextSize);
              }}
              className="input !w-auto !py-1.5"
            >
              {PRODUCT_BATCH_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Total Products</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pageSummary.totalProducts}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Glass Products</p>
            <p className="text-2xl font-black text-[#3b82f6] mt-1">{pageSummary.glassCount}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Aluminum Profiles</p>
            <p className="text-2xl font-black text-[#10b981] mt-1">{pageSummary.aluminumCount}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Low Stock</p>
            <p className="text-2xl font-black text-[#f43f5e] mt-1">{pageSummary.lowStockCount}</p>
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
                {pagedProducts.map((product) => {
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
          
          {pageLoading && pagedProducts.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500" role="status">Loading inventory…</div>
          )}

          {!pageLoading && pageTotalCount === 0 && !isEmpty && (
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

          <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500" aria-live="polite">
              Showing {displayedStart}–{displayedEnd} of {pageTotalCount} matching products
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {pageTotalCount === 0 ? (
                <span className="text-xs text-slate-500">No matching products to load.</span>
              ) : pageHasMore ? (
                <>
                  <span className="text-xs text-slate-500">{loadingMore ? 'Loading more products…' : 'Keep scrolling to load more products.'}</span>
                  {typeof IntersectionObserver === 'undefined' && (
                    <button
                      type="button"
                      onClick={() => void loadMore()}
                      disabled={loadingMore}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                  )}
                  <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
                </>
              ) : (
                <span className="text-xs text-slate-500">All matching products are loaded.</span>
              )}
              {loadingMoreError && <div role="alert" className="flex items-center gap-2 text-xs text-rose-700"><span>{loadingMoreError}</span><button type="button" onClick={() => void loadMore()} className="font-semibold underline">Retry</button></div>}
            </div>
          </div>
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
                <button type="button" onClick={handleCloseRestockModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleRestockSubmit} className="p-6 space-y-4">
                <div>
                  <label className="label" htmlFor="restock-quantity">Quantity to Add</label>
                  <input
                    id="restock-quantity"
                    type="number"
                    name="restockQuantity"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    className="input"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="restock-supplier">Actual Supplier</label>
                  <input
                    id="restock-supplier"
                    type="text"
                    name="restockSupplier"
                    value={restockSupplier}
                    onChange={(e) => setRestockSupplier(e.target.value)}
                    className="input"
                    autoComplete="organization"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="restock-reference">Receipt or purchase-order reference</label>
                  <input
                    id="restock-reference"
                    type="text"
                    name="restockReferenceNo"
                    value={restockReferenceNo}
                    onChange={(e) => setRestockReferenceNo(e.target.value)}
                    className="input"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">Enter the reference shown on the actual receipt or purchase order.</p>
                </div>
                <div>
                  <label className="label" htmlFor="purchase-unit-cost">Purchase cost per unit (₱, optional)</label>
                  <input id="purchase-unit-cost" type="number" name="purchaseUnitCost" value={purchaseUnitCost} onChange={(e) => setPurchaseUnitCost(e.target.value)} className="input" min="0" step="0.01" placeholder="Leave blank if unknown" />
                  <p className="mt-1 text-xs text-slate-500">Recorded acquisition cost for this receipt; this is not the product selling price.</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseRestockModal} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary" disabled={savingRestock}>
                    {savingRestock ? 'Saving…' : 'Confirm Restock'}
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
                <p className="text-gray-500">This product will be hidden from inventory. Its database record and stock-movement history are retained; this screen has no restore action.</p>
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