'use client';
import { useState, useEffect } from 'react';
import { getMockData, INITIAL_CATEGORIES } from '@/lib/mock-data';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import DeleteModal from '@/components/admin/DeleteModal';
import Toast from '@/components/shared/Toast';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCategories(getMockData('kl_categories', INITIAL_CATEGORIES));
  }, []);

  const handleSave = (newCats: any[]) => {
    setCategories(newCats);
    localStorage.setItem('kl_categories', JSON.stringify(newCats));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCategory) {
      const newCats = categories.map(c => c.id === editCategory.id ? { ...c, name } : c);
      handleSave(newCats);
      setToast({ message: 'Category updated successfully!', type: 'success' });
    } else {
      const newCat = { id: `c${Date.now()}`, name, count: 0 };
      handleSave([...categories, newCat]);
      setToast({ message: 'Category created successfully!', type: 'success' });
    }
    setShowModal(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCategory) return;
    handleSave(categories.filter(c => c.id !== deleteCategory.id));
    setToast({ message: 'Category deleted successfully.', type: 'info' });
    setDeleteCategory(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Categories</h2>
        <button 
          onClick={() => { setEditCategory(null); setName(''); setShowModal(true); }}
          className="bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-xs px-5 py-3 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-[#141414] border border-[#2A2420] rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-[#1A1A1A] text-[#A89880] text-xs uppercase tracking-wider border-b border-[#2A2420]">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Products</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                <td className="px-6 py-4 font-bold text-[#F5F0E8]">{cat.name}</td>
                <td className="px-6 py-4 text-[#A89880]">{cat.count} items</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button 
                    onClick={() => { setEditCategory(cat); setName(cat.name); setShowModal(true); }}
                    className="text-[#C9A96E] hover:text-[#C9A96E]-hover p-2 hover:bg-[#1A1A1A] rounded transition-colors inline-flex"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteCategory(cat)}
                    className="text-red-400 hover:text-red-500 p-2 hover:bg-[#1A1A1A] rounded transition-colors inline-flex"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#141414] border border-[#2A2420] rounded-2xl w-full max-w-sm">
            <div className="p-6 border-b border-[#2A2420] flex justify-between items-center">
              <h3 className="text-[#F5F0E8] font-serif text-xl font-bold">{editCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[#A89880] hover:text-[#F5F0E8]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[#A89880] text-xs font-semibold mb-2">Category Name *</label>
                <input 
                  required autoFocus type="text" value={name} onChange={e => setName(e.target.value)} 
                  className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" 
                />
              </div>
              <button type="submit" className="w-full bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-sm py-3.5 rounded-lg transition-colors">
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deleteCategory?.name || ''}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
