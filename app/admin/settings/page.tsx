'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/shared/Toast';
import { Lock, ChevronDown, UserCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const admin = session?.user as any;

  // Store Settings State
  const [storeName, setStoreName] = useState('KicksLab');
  const [storeEmail, setStoreEmail] = useState('KicksLab@gmail.com');
  const [storePhone, setStorePhone] = useState('09-91-28-95-26');
  
  // Admin Profile State
  const [adminName, setAdminName] = useState('');


  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [toast, setToast] = useState<{ message: string; type: "success"|"error"|"info" } | null>(null);

  useEffect(() => {
    // Load store settings
    const saved = localStorage.getItem('kl_store_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.storeName) setStoreName(parsed.storeName);
        if (parsed.storeEmail) setStoreEmail(parsed.storeEmail);
        if (parsed.storePhone) setStorePhone(parsed.storePhone);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const res = await fetch('/api/admin/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user?.name) {
            setAdminName(data.user.name);
          }
        } else if (admin?.name) {
          setAdminName(admin.name);
        }
      } catch (e) {
        if (admin?.name) setAdminName(admin.name);
      }
    };
    fetchAdminProfile();
  }, [admin?.id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Password if form is open
    if (showPasswordForm) {
      if (!currentPassword) {
        setPasswordError("Current password is required.");
        return;
      }
      if (!newPassword) {
        setPasswordError("New password is required.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match!");
        return;
      }
      setPasswordError('');
    }

    // 2. Save Admin Profile & Password via API
    const profilePayload: any = { name: adminName };
    if (showPasswordForm && newPassword) {
      profilePayload.currentPassword = currentPassword;
      profilePayload.newPassword = newPassword;
    }

    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profilePayload),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setToast({ message: data.error || 'Failed to update admin profile', type: 'error' });
        return;
      }

      // Update local session
      await update({
        name: data.user.name,
      });

      if (showPasswordForm) {
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setToast({ message: "Network error updating profile.", type: "error" });
      return;
    }

    // 3. Save Store Settings to localStorage
    const storeSettings = { storeName, storeEmail, storePhone };
    localStorage.setItem('kl_store_settings', JSON.stringify(storeSettings));

    setToast({ message: "Settings saved successfully", type: "success" });
    router.refresh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <h2 className="text-[#F5F0E8] font-serif text-2xl font-bold">Settings</h2>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Admin Profile Section */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-4 border-b border-[#2A2420] pb-2 text-[#F5F0E8]">
            <UserCircle size={20} className="text-[#C9A96E]" />
            <h3 className="font-serif font-bold text-lg">Admin Profile</h3>
          </div>
          


          <div>
            <label className="block text-[#A89880] text-xs font-semibold mb-2">Admin Name</label>
            <input 
              required type="text" 
              value={adminName} onChange={e => setAdminName(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" 
            />
          </div>
        </div>

        {/* Store Settings Section */}
        <div className="bg-[#141414] border border-[#2A2420] rounded-xl p-6 space-y-5">
          <h3 className="text-[#F5F0E8] font-serif font-bold text-lg mb-4 border-b border-[#2A2420] pb-2">Store Information</h3>
          
          <div>
            <label className="block text-[#A89880] text-xs font-semibold mb-2">Store Name</label>
            <input 
              required type="text" 
              value={storeName} onChange={e => setStoreName(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#A89880] text-xs font-semibold mb-2">Store Email</label>
              <input 
                required type="email" 
                value={storeEmail} onChange={e => setStoreEmail(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" 
              />
            </div>
            <div>
              <label className="block text-[#A89880] text-xs font-semibold mb-2">Store Phone</label>
              <input 
                required type="text" 
                value={storePhone} onChange={e => setStorePhone(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none text-sm" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A89880] text-xs font-semibold mb-2">Currency Display</label>
            <input 
              disabled type="text" value="ETB (Ethiopian Birr)"
              className="w-full bg-[#1A1A1A] border border-[#2A2420] rounded-lg px-4 py-3 text-[#A89880] outline-none text-sm cursor-not-allowed opacity-70" 
            />
            <p className="text-[10px] text-[#A89880] mt-1">Currency is locked to ETB. Contact developer to change.</p>
          </div>
        </div>

        {/* Security / Password Section */}
        <div className="border border-[#2A2420] rounded-xl overflow-hidden mt-6">
          <button
            type="button"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setPasswordError('');
            }}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#1A1A1A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock size={16} className="text-[#C9A96E]" />
              <span className="text-[#F5F0E8] text-sm font-semibold">Change Admin Password</span>
            </div>
            <ChevronDown size={16} className={`text-[#A89880] transition-transform duration-200 ${showPasswordForm ? 'rotate-180' : ''}`} />
          </button>

          {showPasswordForm && (
            <div className="px-5 pb-5 pt-2 space-y-3 border-t border-[#2A2420] bg-[#141414]">
              <div>
                <label className="text-[#A89880] text-xs uppercase tracking-widest mb-1.5 block">Current Password *</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] text-[#F5F0E8] rounded-lg px-4 py-3 text-sm focus:border-[#C9A96E] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[#A89880] text-xs uppercase tracking-widest mb-1.5 block">New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] text-[#F5F0E8] rounded-lg px-4 py-3 text-sm focus:border-[#C9A96E] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[#A89880] text-xs uppercase tracking-widest mb-1.5 block">Confirm New Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#0D0D0D] border border-[#2A2420] text-[#F5F0E8] rounded-lg px-4 py-3 text-sm focus:border-[#C9A96E] focus:outline-none"
                />
              </div>
              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
            </div>
          )}
        </div>

        <button type="submit" className="bg-[#C9A96E] hover:bg-[#C9A96E]-hover text-[#0D0D0D] font-bold tracking-widest uppercase text-sm px-8 py-3.5 rounded-lg transition-colors">
          Save Settings
        </button>
      </form>
    </div>
  );
}
