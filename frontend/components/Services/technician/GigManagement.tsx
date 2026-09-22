import React, { useState, useEffect } from 'react';
import { gigApi, GigData } from '../../../services/gigApi';
import { GigCategory } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';

export const GigManagement = () => {
  const { session, user } = useAuth();
  const [gigs, setGigs] = useState<GigData[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GigCategory>(GigCategory.HARDWARE);
  const [price, setPrice] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadGigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await gigApi.list();
      setGigs(res);
    } catch (err) {
      console.error('Failed to load gigs:', err);
      setError('Failed to load gigs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGigs();
  }, [session]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreateGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.userId || !user) return;

    try {
      setSubmitting(true);
      await gigApi.create({
        title,
        description,
        category,
        price,
        estimated_time: estimatedTime,
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setCategory(GigCategory.HARDWARE);
      setPrice(0);
      setEstimatedTime('');
      showToast('success', 'Gig published successfully');
      loadGigs();
    } catch (err) {
      console.error('Failed to create gig:', err);
      showToast('error', 'Failed to create gig. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGig = async (id: string) => {
    try {
      await gigApi.delete(id);
      setDeleteConfirmId(null);
      showToast('success', 'Gig deleted');
      loadGigs();
    } catch (err) {
      console.error('Failed to delete gig:', err);
      showToast('error', 'Failed to delete gig. Please try again.');
    }
  };

  const handleToggleAvailability = async (id: string, current: boolean) => {
    try {
      setTogglingId(id);
      await gigApi.update(id, { is_available: !current });
      setGigs(prev => prev.map(g => g.id === id ? { ...g, isAvailable: !current } : g));
      showToast('success', `Gig ${current ? 'hidden' : 'shown'} on marketplace`);
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      showToast('error', 'Failed to update availability');
    } finally {
      setTogglingId(null);
    }
  };

  const stats = {
    total: gigs.length,
    active: gigs.filter(g => g.isAvailable).length,
    inactive: gigs.filter(g => !g.isAvailable).length,
    totalEarnings: gigs.reduce((sum, g) => sum + (g.price || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Gig Management</h2>
          <p className="text-slate-400">Offer your technician services on the marketplace.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-lg flex items-center gap-2 ${isCreating ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}
        >
          {isCreating ? Icons.close : Icons.plus}
          {isCreating ? 'Cancel' : 'Create New Gig'}
        </button>
      </div>

      {!loading && gigs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total Gigs</span>
            <span className="text-2xl font-bold text-white">{stats.total}</span>
          </div>
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Active</span>
            <span className="text-2xl font-bold text-emerald-400">{stats.active}</span>
          </div>
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Hidden</span>
            <span className="text-2xl font-bold text-slate-400">{stats.inactive}</span>
          </div>
          <div className="glass p-4 rounded-xl border border-white/5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Avg Price</span>
            <span className="text-2xl font-bold text-indigo-400">PKR {stats.total > 0 ? Math.round(stats.totalEarnings / stats.total).toLocaleString() : '0'}</span>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="glass rounded-xl p-6 border border-white/5 bg-indigo-500/5">
          <h3 className="text-lg font-semibold text-white mb-4">Post a New Service</h3>
          <form onSubmit={handleCreateGig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Gig Title</label>
                  <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. PC Overheating Fix (Thermal Paste)" className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as GigCategory)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                    {Object.values(GigCategory).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Price (PKR)</label>
                  <input required type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="1500" className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Estimated Time</label>
                  <input required value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="e.g. 2 hours" className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50" />
               </div>
            </div>

            <div>
               <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Description</label>
               <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the service..." className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"></textarea>
            </div>

            <button type="submit" disabled={submitting} className={`font-medium px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${submitting ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
              {submitting ? 'Publishing...' : 'Publish Service Gig'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-xl p-5 border border-white/5 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="col-span-full p-12 text-center glass rounded-xl border border-rose-500/20">
            <p className="text-rose-400 mb-3">{error}</p>
            <button onClick={loadGigs} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors">
              Retry
            </button>
          </div>
        ) : gigs.length === 0 ? (
          <div className="col-span-full p-12 text-center glass rounded-xl border border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
               {Icons.tag}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No Gigs Yet</h3>
            <p className="text-slate-500">Create your first gig to start receiving requests.</p>
          </div>
        ) : (
          gigs.map(gig => (
            <div key={gig.id} className="glass rounded-xl p-5 border border-white/5 flex flex-col relative group">
              <div className="absolute top-4 right-4 flex items-center gap-2">
                 <button
                   onClick={() => handleToggleAvailability(gig.id, gig.isAvailable)}
                   disabled={togglingId === gig.id}
                   className={`p-1.5 rounded transition-colors ${
                     gig.isAvailable
                       ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                       : 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20'
                   } ${togglingId === gig.id ? 'opacity-50' : ''}`}
                   title={gig.isAvailable ? 'Hide from marketplace' : 'Show on marketplace'}
                 >
                   {gig.isAvailable ? '👁' : '🚫'}
                 </button>
                 {deleteConfirmId === gig.id ? (
                   <div className="flex items-center gap-1 bg-rose-500/20 rounded p-0.5">
                     <button onClick={() => handleDeleteGig(gig.id)} className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded transition-colors">Confirm</button>
                     <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] rounded transition-colors">Cancel</button>
                   </div>
                 ) : (
                   <button onClick={() => setDeleteConfirmId(gig.id)} className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100">
                     {Icons.close}
                   </button>
                 )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                 <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                   {gig.category}
                 </span>
                 {gig.isAvailable
                   ? <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
                   : <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-slate-500/10 text-slate-400 border border-slate-500/20">Hidden</span>
                 }
              </div>

              <h3 className="text-lg font-semibold text-white mb-1 tracking-tight">{gig.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{gig.description}</p>

              <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                 <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                   PKR {gig.price.toLocaleString()}
                 </div>
                 <div className="text-xs text-slate-500 mono bg-black/20 px-2 py-1 rounded">
                   {gig.estimatedTime}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
