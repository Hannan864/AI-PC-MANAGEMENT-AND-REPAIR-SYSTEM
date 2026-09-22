import React, { useState, useEffect } from 'react';
import { gigApi, GigData } from '../../../services/gigApi';
import { repairApi } from '../../../services/repairApi';
import { GigCategory, RepairRequestStatus } from '../../../types';
import { useAuth } from '../../Layout/AuthProvider';
import { Icons } from '../../../constants';

export const BrowseGigs = () => {
  const { session, user } = useAuth();
  const [gigs, setGigs] = useState<GigData[]>([]);
  const [activeCategory, setActiveCategory] = useState<GigCategory | 'ALL'>('ALL');
  const [selectedGig, setSelectedGig] = useState<GigData | null>(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'newest'>('recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const gigsPerPage = 6;
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    setIsLoading(true);
    try {
      const res = await gigApi.list();
      setGigs(res.filter(g => g.isAvailable));
    } catch (err) {
      console.error('Failed to load gigs:', err);
      setToast({ type: 'error', message: 'Failed to load services. Please refresh the page.' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.userId || !user || !selectedGig) return;
    
    // Validate description length before submitting
    if (issueDescription.trim().length < 10) {
      setToast({ type: 'error', message: 'Please describe your issue in at least 10 characters.' });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setIsSubmitting(true);

    try {
      await repairApi.create({
        gig_title: selectedGig.title,
        issue_category: selectedGig.category,
        issue_description: issueDescription.trim(),
        severity_level: 'medium', // Default severity for gig-based requests
      });
      
      setToast({ 
        type: 'success', 
        message: `Request submitted! ${selectedGig.technicianName} will be notified. An admin will assign them shortly.` 
      });
      setSelectedGig(null);
      setIssueDescription('');
      setTimeout(() => setToast(null), 5000);
    } catch (err: any) {
      console.error('Failed to submit repair request:', err);
      
      // Extract detailed error message from backend response
      let errorMessage = 'Failed to submit request. Please try again.';
      
      if (err?.response?.data) {
        const responseData = err.response.data;
        
        // Handle Laravel validation errors
        if (responseData.errors) {
          const firstError = Object.values(responseData.errors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMessage = firstError[0];
          }
        }
        // Handle custom error message
        else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      setToast({ type: 'error', message: errorMessage });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGigs = gigs
    .filter(g => activeCategory === 'ALL' || g.category === activeCategory)
    .filter(g => searchQuery === '' || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase()) || g.technicianName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return String(b.createdAt).localeCompare(String(a.createdAt));
      return 0; // recommended - keep original order
    });

  const totalPages = Math.ceil(filteredGigs.length / gigsPerPage);
  const paginatedGigs = filteredGigs.slice((currentPage - 1) * gigsPerPage, currentPage * gigsPerPage);

  return (
    <div className="space-y-6 relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <span className="text-indigo-400">{Icons.search}</span>
            </span>
            Gig Marketplace
          </h2>
          <p className="text-slate-400 mt-1">Find and request expert repairs from certified technicians.</p>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search gigs, services, or technicians..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#020617] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {Icons.search}
          </div>
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as any); setCurrentPage(1); }}
          className="bg-[#020617] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
        >
          <option value="recommended">Recommended</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
        <button 
          onClick={() => setActiveCategory('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-200 whitespace-nowrap ${activeCategory === 'ALL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'}`}
        >
          All Categories
        </button>
        {Object.values(GigCategory).map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase transition-all duration-200 whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Total Services</span>
          <p className="text-2xl font-bold text-white">{gigs.length}</p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Filtered</span>
          <p className="text-2xl font-bold text-indigo-400">{filteredGigs.length}</p>
        </div>
        <div className="bg-slate-950/50 rounded-xl p-3 border border-white/5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">Categories</span>
          <p className="text-2xl font-bold text-emerald-400">{Object.values(GigCategory).length}</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-xl p-5 border border-white/5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-16"></div>
                </div>
              </div>
              <div className="h-5 bg-white/10 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/10 rounded mb-4"></div>
              <div className="h-10 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {paginatedGigs.length === 0 ? (
           <div className="col-span-full p-12 text-center glass rounded-xl border border-white/5">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
                {Icons.search}
             </div>
             <h3 className="text-lg font-semibold text-white mb-1">No Gigs Found</h3>
             <p className="text-slate-500">No technicians have posted services matching your criteria.</p>
             {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="mt-4 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-sm font-medium text-indigo-400 transition-all duration-200"
               >
                 Clear Search
               </button>
             )}
           </div>
        ) : (
           paginatedGigs.map(gig => (
            <div key={gig.id} className="glass rounded-xl p-5 border border-white/5 flex flex-col group hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold transition-transform duration-200 group-hover:scale-110">
                       {gig.technicianName.charAt(0).toUpperCase()}
                     </div>
                     <div>
                       <div className="font-semibold text-white text-sm">{gig.technicianName}</div>
                       <div className="text-xs text-amber-400 flex items-center gap-1">
                         {Icons.star} 4.9 (Pro Tech)
                       </div>
                     </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {gig.category}
                  </span>
               </div>
               
               <h3 className="text-lg font-semibold text-white mb-1 tracking-tight group-hover:text-indigo-400 transition-colors duration-200">{gig.title}</h3>
               <p className="text-sm text-slate-400 line-clamp-2 mb-6 flex-1">{gig.description}</p>
               
               <div className="bg-[#020617]/50 rounded-lg p-3 border border-white/5 mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Price</div>
                    <div className="font-semibold text-emerald-400">PKR {gig.price.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Time</div>
                    <div className="font-semibold text-slate-300">{gig.estimatedTime}</div>
                  </div>
               </div>
               
               <button 
                 onClick={() => setSelectedGig(gig)}
                 className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
               >
                 Request Service
               </button>
            </div>
           ))
        )}
      </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                currentPage === i + 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Service Request Modal */}
      {selectedGig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
          <div className="w-full h-full md:h-auto md:max-w-lg glass md:rounded-2xl border-0 md:border md:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-indigo-500/5 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Service Request</span>
                <h3 className="text-lg font-semibold text-white mt-0.5">Request Repair Service</h3>
              </div>
              <button 
                onClick={() => setSelectedGig(null)} 
                className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
              >
                {Icons.close}
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleRequestService} className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Gig Info Card */}
              <div className="p-4 bg-black/30 rounded-lg border border-white/5 space-y-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                     {selectedGig.technicianName.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <div className="font-semibold text-white">{selectedGig.title}</div>
                     <div className="text-sm text-slate-400">Served by {selectedGig.technicianName}</div>
                   </div>
                 </div>
                 <div className="flex items-center justify-between text-sm pt-3 mt-3 border-t border-white/5">
                    <span className="text-slate-500">Service Price</span>
                    <span className="font-semibold text-emerald-400">PKR {selectedGig.price.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Estimated Time</span>
                    <span className="font-semibold text-slate-300">{selectedGig.estimatedTime}</span>
                 </div>
                 <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Category</span>
                    <span className="font-semibold text-indigo-400">{selectedGig.category}</span>
                 </div>
              </div>

              {/* Issue Description */}
              <div>
                 <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                   Describe Your Issue <span className="text-rose-400">*</span>
                 </label>
                 <textarea 
                   required 
                   minLength={10}
                   value={issueDescription} 
                   onChange={(e) => setIssueDescription(e.target.value)} 
                   rows={4} 
                   placeholder="Please provide details about your system's problem, recent changes, or error messages (minimum 10 characters)..." 
                   className="w-full bg-[#020617] border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-vertical transition-colors"
                 ></textarea>
                 <div className="flex justify-between mt-1.5">
                   <span className={`text-[10px] font-medium ${issueDescription.length >= 10 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     {issueDescription.length}/10 minimum characters
                   </span>
                   {issueDescription.length > 0 && issueDescription.length < 10 && (
                     <span className="text-[10px] text-amber-400 font-medium">
                       {10 - issueDescription.length} more characters needed
                     </span>
                   )}
                 </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                 <button 
                   type="button" 
                   onClick={() => setSelectedGig(null)} 
                   className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-medium rounded-lg transition-colors border border-white/5"
                 >
                   Cancel
                 </button>
                 <button 
                   type="submit" 
                   disabled={isSubmitting || issueDescription.trim().length < 10} 
                   className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                 >
                   {isSubmitting ? (
                     <span className="flex items-center justify-center gap-2">
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       Submitting...
                     </span>
                   ) : (
                     'Confirm Request'
                   )}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl backdrop-blur-sm transition-all duration-300 animate-in slide-in-from-bottom-4 ${
          toast.type === 'success' ? 'bg-emerald-500/90 text-white border border-emerald-400/30' : 'bg-red-500/90 text-white border border-red-400/30'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{toast.type === 'success' ? '✓' : '⚠'}</span>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
