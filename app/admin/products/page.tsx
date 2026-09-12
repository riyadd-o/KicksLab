'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, Star, Tag, Sparkles, TrendingUp } from 'lucide-react';
import ImageUploader from "@/components/admin/ImageUploader";
import DeleteModal from "@/components/admin/DeleteModal";
import Toast from "@/components/shared/Toast";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: string;
  gender: string;
  sizes: string[];
  images: string[];
  rating: number;
  featured: boolean;
  topSelling: boolean;
  onSale: boolean;
  isNew: boolean;
  stock: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modals & States
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'Sneakers',
    gender: 'Men',
    price: '',
    originalPrice: '',
    description: '',
    sizes: [] as string[],
    images: [''],
    featured: false,
    topSelling: false,
    onSale: false,
    isNew: false,
    stock: '10'
  });

  const availableSizes = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products?admin=true");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddForm = () => {
    setEditProduct(null);
    setFormData({
      name: '',
      slug: '',
      category: 'Sneakers',
      gender: 'Men',
      price: '',
      originalPrice: '',
      description: '',
      sizes: [],
      images: [''],
      featured: false,
      topSelling: false,
      onSale: false,
      isNew: false,
      stock: '10'
    });
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (prod: Product) => {
    setEditProduct(prod);
    setFormData({
      name: prod.name,
      slug: prod.slug,
      category: prod.category,
      gender: prod.gender, 
      price: prod.price.toString(),
      originalPrice: (prod.onSale && prod.originalPrice) ? prod.originalPrice.toString() : '',
      description: prod.description || '',
      sizes: prod.sizes || [],
      images: [prod.images[0] || ''], 
      featured: prod.featured,
      topSelling: prod.topSelling,
      onSale: prod.onSale,
      isNew: prod.isNew,
      stock: (prod.stock ?? 10).toString()
    });
    setErrors({});
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Required';
    if (!formData.slug.trim()) newErrors.slug = 'Required';
    if (!formData.price.toString().trim() || isNaN(parseFloat(formData.price))) newErrors.price = 'Required';
    if (!formData.images[0]?.trim()) newErrors.image = 'Required';
    if (formData.sizes.length === 0) newErrors.sizes = 'Required';
    if (!formData.stock.toString().trim() || isNaN(parseInt(formData.stock))) newErrors.stock = 'Required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSaving(true);
      const isEdit = !!editProduct;
      const url = isEdit ? `/api/products/${editProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: formData.name,
        slug: formData.slug,
        category: formData.category,
        gender: formData.gender,
        price: parseFloat(formData.price),
        originalPrice: (formData.onSale && formData.originalPrice) ? parseFloat(formData.originalPrice) : null,
        description: formData.description,
        sizes: formData.sizes,
        images: formData.images.filter(img => img.trim() !== ''),
        featured: formData.featured,
        topSelling: formData.topSelling,
        onSale: formData.onSale,
        isNew: formData.isNew,
        stock: parseInt(formData.stock)
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ message: data.error || 'Failed to save product.', type: 'error' });
        return;
      }

      await fetchProducts();
      setShowForm(false);
      setToast({
        message: isEdit ? 'Product updated successfully!' : 'Product created successfully!',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setToast({ message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProduct) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/products/${deleteProduct.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== deleteProduct.id));
        setToast({ message: 'Product deleted successfully.', type: 'success' });
      } else {
        const data = await res.json();
        setToast({ message: data.error || 'Failed to delete product.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to delete product.', type: 'error' });
    } finally {
      setIsDeleting(false);
      setDeleteProduct(null);
    }
  };

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) 
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size].sort((a, b) => parseInt(a) - parseInt(b))
    }));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg pl-10 pr-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89880]" size={16} />
        </div>
        <button 
          onClick={openAddForm}
          className="bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-xs px-5 py-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-[#141414] border border-[#2A2420] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans whitespace-nowrap">
            <thead className="bg-[#1A1A1A] text-[#A89880] text-xs uppercase tracking-wider border-b border-[#2A2420]">
              <tr>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Price (ETB)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Tags</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#A89880]">
                    <div className="flex flex-col items-center gap-2 justify-center">
                      <div className="w-6 h-6 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs uppercase tracking-wider text-[#A89880] mt-1">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded border border-[#2A2420] object-cover" />
                      <div>
                        <p className="text-[#F5F0E8] font-bold">{product.name}</p>
                        <p className="text-[#A89880] text-xs">{product.sizes?.length || 0} sizes</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#A89880]">{product.category}</td>
                  <td className="px-6 py-4 font-semibold text-[#F5F0E8]">{product.price.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {product.stock > 0 ? (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-500/10 border border-green-500/30 text-green-400">In Stock ({product.stock})</span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 border border-red-500/30 text-red-400">Out of Stock</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {product.featured && <span title="Featured" className="p-1 rounded bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 flex items-center justify-center"><Star size={14} /></span>}
                      {product.onSale && <span title="On Sale" className="p-1 rounded bg-red-500/15 text-red-500 border border-red-500/30 flex items-center justify-center"><Tag size={14} /></span>}
                      {product.isNew && <span title="New" className="p-1 rounded bg-blue-500/15 text-blue-500 border border-blue-500/30 flex items-center justify-center"><Sparkles size={14} /></span>}
                      {product.topSelling && <span title="Top Selling" className="p-1 rounded bg-green-500/15 text-green-500 border border-green-500/30 flex items-center justify-center"><TrendingUp size={14} /></span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => openEditForm(product)} className="text-[#C9A96E] hover:text-[#C9A96E]-hover p-2 hover:bg-[#1A1A1A] rounded transition-colors inline-flex">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => setDeleteProduct(product)} className="text-red-400 hover:text-red-500 p-2 hover:bg-[#1A1A1A] rounded transition-colors inline-flex">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredProducts.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-[#A89880]">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Drawer/Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => !isSaving && setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-[#0A0A0A] border-l border-[#2A2420] h-full flex flex-col">
            <div className="p-6 border-b border-[#2A2420] flex justify-between items-center bg-[#0A0A0A]">
              <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => !isSaving && setShowForm(false)} className="text-[#A89880] hover:text-[#F5F0E8] disabled:opacity-50" disabled={isSaving}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Product Name *</label>
                <input type="text" value={formData.name} disabled={isSaving} onChange={(e) => {
                  setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')});
                  if (errors.name) setErrors(prev => ({...prev, name: ''}));
                }} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm disabled:opacity-50" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              
              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Slug *</label>
                <input type="text" value={formData.slug} disabled={isSaving} onChange={(e) => {
                  setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')});
                  if (errors.slug) setErrors(prev => ({...prev, slug: ''}));
                }} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm disabled:opacity-50" />
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                <p className="text-[#5C5248] text-[10px] mt-1">URL friendly identifier (e.g., 'chelsea-boots'). Auto-generated from name.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#A89880] text-xs font-semibold mb-2">Category *</label>
                  <select value={formData.category} disabled={isSaving} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm disabled:opacity-50">
                    {['Sneakers', 'Heels', 'Boots', 'Loafers', 'Sandals'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[#A89880] text-xs font-semibold mb-2">Gender *</label>
                  <select value={formData.gender} disabled={isSaving} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm disabled:opacity-50">
                    {['Men', 'Women', 'Unisex'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Price (ETB) *</label>
                <input type="number" value={formData.price} disabled={isSaving} onChange={(e) => {
                  setFormData({...formData, price: e.target.value});
                  if (errors.price) setErrors(prev => ({...prev, price: ''}));
                }} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm disabled:opacity-50" placeholder="e.g. 4500" />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Inventory (Stock Count) *</label>
                <input type="number" value={formData.stock} disabled={isSaving} onChange={(e) => {
                  setFormData({...formData, stock: e.target.value});
                  if (errors.stock) setErrors(prev => ({...prev, stock: ''}));
                }} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm disabled:opacity-50" />
                {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                <p className="text-[#5C5248] text-[10px] mt-1">Products with 0 stock automatically show as "Out of Stock". Customer ratings are automatically derived from verified approved reviews.</p>
              </div>

              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Description (optional)</label>
                <textarea value={formData.description} disabled={isSaving} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm min-h-[80px] resize-none disabled:opacity-50" />
              </div>

              <div>
                <ImageUploader
                  value={formData.images[0] || ""}
                  onChange={(src) => {
                    setFormData({ ...formData, images: [src] });
                    if (errors.image) setErrors(prev => ({...prev, image: ''}));
                  }}
                />
                {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
              </div>

              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Sizes *</label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(sizeNum => {
                    const size = sizeNum.toString();
                    return (
                      <button 
                        type="button" 
                        key={size} 
                        disabled={isSaving}
                        onClick={() => {
                          toggleSize(size);
                          if (errors.sizes) setErrors(prev => ({...prev, sizes: ''}));
                        }}
                        className={`w-10 h-10 rounded text-xs font-bold transition-colors disabled:opacity-50 ${formData.sizes.includes(size) ? 'bg-[#C9A96E] text-[#0D0D0D]' : 'bg-[#1A1A1A] text-[#A89880] border border-[#2A2420] hover:border-[#C9A96E]'}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {errors.sizes && <p className="text-red-500 text-xs mt-1">{errors.sizes}</p>}
              </div>

              <div className="space-y-3 pt-2 border-t border-[#2A2420]">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'featured', label: 'Featured' },
                    { key: 'topSelling', label: 'Top Selling' },
                    { key: 'onSale', label: 'On Sale' },
                    { key: 'isNew', label: 'New Arrival' }
                  ].map(toggle => (
                    <label key={toggle.key} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={(formData as any)[toggle.key]}
                          disabled={isSaving}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              [toggle.key]: checked,
                              ...(toggle.key === 'onSale' && !checked ? { originalPrice: '' } : {})
                            }));
                          }}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${ (formData as any)[toggle.key] ? 'bg-[#C9A96E]' : 'bg-border'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${ (formData as any)[toggle.key] ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="text-[#F5F0E8] text-sm">{toggle.label}</span>
                    </label>
                  ))}
                </div>

                {/* Dropdown Original Price Field exclusively when On Sale is active */}
                {formData.onSale && (
                  <div className="bg-[#181818] border border-[#C9A96E]/40 rounded-xl p-3.5 space-y-1.5 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#C9A96E] text-xs font-semibold">
                        Orig. Price (Strikethrough Price)
                      </label>
                      {formData.originalPrice && formData.price && parseFloat(formData.originalPrice) > parseFloat(formData.price) && (
                        <span className="text-[10px] text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-2 py-0.5 rounded-full font-medium">
                          {Math.round(((parseFloat(formData.originalPrice) - parseFloat(formData.price)) / parseFloat(formData.originalPrice)) * 100)}% OFF
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={formData.originalPrice}
                      disabled={isSaving}
                      placeholder="e.g. 6000 (higher than sale price)"
                      onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                      className="w-full bg-[#121212] border border-[#2A2420] rounded-lg px-4 py-2.5 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm disabled:opacity-50"
                    />
                    <p className="text-[#A89880] text-[11px] leading-relaxed">
                      Strikethrough price shown to customers while this product is On Sale.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#2A2420]">
                <button type="submit" disabled={isSaving} className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover disabled:bg-[#C9A96E]/50 text-[#0D0D0D] font-bold tracking-widest uppercase text-sm py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : editProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"? This will permanently remove it from the catalog and cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
