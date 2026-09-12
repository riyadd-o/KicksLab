'use client';

import { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, RefreshCw, DollarSign, MapPin } from 'lucide-react';

interface ShippingSettings {
  id: string;
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
}

interface ShippingZone {
  id: string;
  name: string;
  city: string;
  fee: number;
  active: boolean;
  createdAt: string;
}

export default function AdminShippingPage() {
  const [settings, setSettings] = useState<ShippingSettings | null>(null);
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Free shipping form state
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(5000);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);

  // Zone form states
  const [zoneName, setZoneName] = useState('');
  const [zoneCity, setZoneCity] = useState('');
  const [zoneFee, setZoneFee] = useState<number | ''>('');
  const [zoneActive, setZoneActive] = useState(true);
  const [submittingZone, setSubmittingZone] = useState(false);

  const fetchShippingData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shipping');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setZones(data.zones);
        if (data.settings) {
          setFreeShippingEnabled(data.settings.freeShippingEnabled);
          setFreeShippingThreshold(data.settings.freeShippingThreshold);
        }
      }
    } catch (err) {
      console.error("Failed to load shipping settings:", err);
      showNotification("Failed to load shipping settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/shipping/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingEnabled,
          freeShippingThreshold,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save settings');
      }

      const updated = await res.json();
      setSettings(updated);
      showNotification('Free shipping settings saved successfully!', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName || !zoneCity || zoneFee === '') return;
    setSubmittingZone(true);

    try {
      const res = await fetch('/api/admin/shipping/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneName,
          city: zoneCity,
          fee: Number(zoneFee),
          active: zoneActive,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create zone');
      }

      const newZone = await res.json();
      setZones((prev) => [...prev, newZone]);
      showNotification(`Shipping zone "${newZone.name}" created successfully!`, 'success');
      closeModal();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create zone', 'error');
    } finally {
      setSubmittingZone(false);
    }
  };

  const handleUpdateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !zoneName || !zoneCity || zoneFee === '') return;
    setSubmittingZone(true);

    try {
      const res = await fetch(`/api/admin/shipping/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneName,
          city: zoneCity,
          fee: Number(zoneFee),
          active: zoneActive,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update zone');
      }

      const updated = await res.json();
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      showNotification(`Shipping zone "${updated.name}" updated!`, 'success');
      closeModal();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update zone', 'error');
    } finally {
      setSubmittingZone(false);
    }
  };

  const handleToggleZoneStatus = async (zone: ShippingZone) => {
    try {
      const res = await fetch(`/api/admin/shipping/zones/${zone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !zone.active }),
      });

      if (!res.ok) throw new Error('Failed to toggle status');
      const updated = await res.json();
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      showNotification(`Zone status updated to ${updated.active ? 'Active' : 'Inactive'}`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update zone status', 'error');
    }
  };

  const handleDeleteZone = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete shipping zone "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/shipping/zones/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete zone');

      setZones((prev) => prev.filter((z) => z.id !== id));
      showNotification(`Shipping zone "${name}" deleted.`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete zone', 'error');
    }
  };

  const openAddModal = () => {
    setZoneName('');
    setZoneCity('');
    setZoneFee('');
    setZoneActive(true);
    setEditingZone(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (zone: ShippingZone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setZoneCity(zone.city);
    setZoneFee(zone.fee);
    setZoneActive(zone.active);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingZone(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#F5F0E8]">
        <RefreshCw className="h-8 w-8 animate-spin text-[#C9A96E] mb-3" />
        <p className="text-sm font-sans text-[#A89880]">Loading Shipping Configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2420] pb-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5F0E8] flex items-center gap-3">
            <Truck className="text-[#C9A96E] h-7 w-7" />
            Shipping Management
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#A89880] mt-1">
            Configure delivery zones, location fees, and free-shipping thresholds.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#C9A96E] px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors shadow-md self-start sm:self-auto"
        >
          <Plus size={16} />
          Add Shipping Zone
        </button>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
            notification.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Section 1: Free Shipping Threshold Settings */}
      <div className="rounded-xl border border-[#2A2420] bg-[#141414] p-6 space-y-6">
        <div className="border-b border-[#2A2420] pb-4">
          <h2 className="font-serif text-lg font-bold text-[#F5F0E8]">Free Shipping Policy</h2>
          <p className="font-sans text-xs text-[#A89880] mt-1">
            Customers whose qualifying order subtotal equals or exceeds this threshold will receive free delivery across all active zones.
          </p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1A1A1A] border border-[#2A2420]">
            <div>
              <p className="font-sans text-sm font-semibold text-[#F5F0E8]">Enable Free Shipping Threshold</p>
              <p className="font-sans text-xs text-[#A89880] mt-0.5">
                Automatically waive shipping fees for qualifying orders
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={freeShippingEnabled}
                onChange={(e) => setFreeShippingEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2A2420] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
                Free Shipping Threshold (ETB)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89880] text-sm font-semibold">
                  ETB
                </span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                  disabled={!freeShippingEnabled}
                  className="w-full rounded-lg border border-[#2A2420] bg-[#1A1A1A] pl-14 pr-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none disabled:opacity-40"
                  required
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#C9A96E] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors shadow-md disabled:opacity-50"
              >
                {savingSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Section 2: Configurable Shipping Zones Table */}
      <div className="rounded-xl border border-[#2A2420] bg-[#141414] overflow-hidden">
        <div className="p-6 border-b border-[#2A2420] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#F5F0E8]">Shipping Zones</h2>
            <p className="font-sans text-xs text-[#A89880] mt-0.5">
              Manage regions and their standard shipping rates (in ETB).
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2420] text-[#C9A96E]">
            {zones.length} {zones.length === 1 ? 'Zone' : 'Zones'} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-sans whitespace-nowrap">
            <thead className="bg-[#1A1A1A] text-[#A89880] text-xs uppercase tracking-wider border-b border-[#2A2420]">
              <tr>
                <th className="px-6 py-4 font-semibold">Zone Name</th>
                <th className="px-6 py-4 font-semibold">City / Location</th>
                <th className="px-6 py-4 font-semibold">Delivery Fee</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2420]">
              {zones.map((zone) => (
                <tr key={zone.id} className="hover:bg-[#1A1A1A]/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#F5F0E8] flex items-center gap-2">
                    <MapPin size={16} className="text-[#C9A96E]" />
                    {zone.name}
                  </td>
                  <td className="px-6 py-4 text-[#A89880]">{zone.city}</td>
                  <td className="px-6 py-4 font-semibold text-[#F5F0E8]">
                    ETB {zone.fee.toLocaleString()}.00
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleZoneStatus(zone)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                        zone.active
                          ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                          : 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20'
                      }`}
                    >
                      {zone.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(zone)}
                      className="p-1.5 rounded bg-[#1A1A1A] border border-[#2A2420] text-[#A89880] hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
                      title="Edit Zone"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone.id, zone.name)}
                      className="p-1.5 rounded bg-[#1A1A1A] border border-[#2A2420] text-[#A89880] hover:text-red-400 hover:border-red-400 transition-colors"
                      title="Delete Zone"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}

              {zones.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#A89880]">
                    No shipping zones found. Click "Add Shipping Zone" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Zone Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={closeModal} />
          <div className="relative w-full max-w-md rounded-xl border border-[#2A2420] bg-[#141414] p-6 shadow-2xl space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#F5F0E8]">
              {editingZone ? 'Edit Shipping Zone' : 'Add New Shipping Zone'}
            </h3>

            <form onSubmit={editingZone ? handleUpdateZone : handleCreateZone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
                  Zone Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dire Dawa Express"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2420] bg-[#1A1A1A] px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
                  City / Region Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dire Dawa"
                  value={zoneCity}
                  onChange={(e) => setZoneCity(e.target.value)}
                  className="w-full rounded-lg border border-[#2A2420] bg-[#1A1A1A] px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A89880] uppercase tracking-wider mb-2">
                  Delivery Fee (ETB)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="e.g. 100"
                  value={zoneFee}
                  onChange={(e) => setZoneFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full rounded-lg border border-[#2A2420] bg-[#1A1A1A] px-4 py-2.5 text-sm text-[#F5F0E8] focus:border-[#C9A96E] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-[#A89880] uppercase tracking-wider">
                  Active Status
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zoneActive}
                    onChange={(e) => setZoneActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#2A2420] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C9A96E]"></div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2A2420]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-[#2A2420] px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-[#A89880] hover:text-[#F5F0E8] hover:bg-[#1A1A1A] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingZone}
                  className="rounded-lg bg-[#C9A96E] px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-widest text-[#0D0D0D] hover:bg-[#C9A96E]-hover transition-colors shadow-md disabled:opacity-50"
                >
                  {submittingZone ? <RefreshCw className="h-4 w-4 animate-spin" /> : editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
