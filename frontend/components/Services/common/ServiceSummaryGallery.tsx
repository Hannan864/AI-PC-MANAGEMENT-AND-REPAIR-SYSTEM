import React from 'react';

interface ServiceSummaryGalleryProps {
  userImages?: string[];
  techImages?: string[];
}

export const ServiceSummaryGallery: React.FC<ServiceSummaryGalleryProps> = ({ userImages, techImages }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
      {/* User Submission Images */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
          Customer Issue Screenshots ({userImages?.length || 0})
        </span>
        {userImages && userImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 bg-slate-950/20 p-3 rounded-lg border border-white/5">
            {userImages.map((base64, index) => (
              <div key={index} className="aspect-square rounded-md overflow-hidden border border-white/10 bg-black">
                <img
                  src={base64}
                  alt={`Customer Issue proof #${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={() => window.open(base64, '_blank')}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-950/30 rounded-xl text-center text-slate-600 text-xs italic font-medium leading-normal">
            No visual proof screenshot was submitted by user.
          </div>
        )}
      </div>

      {/* Tech Report Images */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
          Technician Completion photos ({techImages?.length || 0})
        </span>
        {techImages && techImages.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 bg-slate-950/20 p-3 rounded-lg border border-white/5">
            {techImages.map((base64, index) => (
              <div key={index} className="aspect-square rounded-md overflow-hidden border border-white/10 bg-black">
                <img
                  src={base64}
                  alt={`Technician Completion proof #${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  referrerPolicy="no-referrer"
                  onClick={() => window.open(base64, '_blank')}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-950/30 rounded-xl text-center text-slate-600 text-xs italic font-medium leading-normal">
            No maintenance layout photos were attached to final report.
          </div>
        )}
      </div>
    </div>
  );
};
