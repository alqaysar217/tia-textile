
'use client';

import React, { useMemo } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { MapPin, Phone, Building2, Globe, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function BranchesPage() {
  const { lang, t, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  const branchesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'branches'),
      where('status', '==', 'active')
    );
  }, [db]);

  const { data: rawBranches, loading } = useCollection<any>(branchesQuery);

  const branches = useMemo(() => {
    if (!rawBranches) return [];
    return [...rawBranches].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeA - timeB; // Oldest first
    });
  }, [rawBranches]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none textile-pattern" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      {/* Hero Header */}
      <div className="py-16 md:py-24 bg-primary relative text-primary-foreground overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
            <Globe className="h-3 w-3" />
            {isRtl ? 'شبكة معارضنا' : 'OUR SHOWROOM NETWORK'}
          </div>
          <h1 className="text-3xl md:text-6xl font-black drop-shadow-xl">
            {t.nav.branches}
          </h1>
          <p className="text-sm md:text-lg opacity-80 max-w-2xl mx-auto font-medium leading-relaxed">
            {isRtl 
              ? 'نحن متواجدون في أهم المراكز التجارية لنكون أقرب إليكم دائماً بمنتجاتنا التراثية الأصيلة.' 
              : 'We are present in major commercial centers to always be closer to you with our authentic heritage products.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-black text-primary animate-pulse">{isRtl ? 'جاري جلب المواقع...' : 'Loading locations...'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {branches.map((branch) => (
              <div key={branch.id} className="group bg-card rounded-[2.5rem] border border-border/50 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                {/* Image Section */}
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img 
                    src={branch.photoUrl || `https://picsum.photos/seed/${branch.id}/800/600`} 
                    alt={branch.nameAr} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-md border-none font-black shadow-lg">
                      {isRtl ? 'فرع معتمد' : 'Authorized'}
                    </Badge>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 space-y-6 flex flex-col flex-1">
                  <div className="space-y-2 text-right" dir="rtl">
                    <h2 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-3 justify-start group-hover:text-primary transition-colors">
                      <Building2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      {branch.nameAr}
                    </h2>
                    <div className="flex items-start gap-3 text-muted-foreground pt-2 justify-start">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                      <p className="text-sm md:text-base font-medium leading-relaxed">
                        {branch.addressAr}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50 space-y-4 mt-auto">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3" dir="rtl">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                             <Phone className="h-5 w-5" />
                          </div>
                          <span className="text-lg font-black tabular-nums tracking-tighter">{branch.phoneNumber}</span>
                       </div>
                       <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">
                         {isRtl ? 'نشط' : 'ACTIVE'}
                       </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest justify-center md:justify-start">
                       <Clock className="w-3 h-3" />
                       {isRtl ? 'مفتوح من 8:00 صباحاً - 9:00 مساءً' : 'Open 8:00 AM - 9:00 PM'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* System Trust Note */}
        <div className="mt-20 p-8 md:p-12 bg-muted/30 rounded-[3rem] border border-dashed border-border/50 text-center space-y-4">
           <ShieldCheck className="w-12 h-12 text-primary/30 mx-auto" />
           <h3 className="text-xl font-black">{isRtl ? 'التزامنا بالجودة' : 'Our Quality Commitment'}</h3>
           <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
             {isRtl 
               ? 'جميع فروعنا المذكورة أعلاه تتبع مباشرة لجمعية الصناعات النسيجية، وتضمن لكم الحصول على المنتجات الأصلية المعتمدة بضمان الجودة الحرفية.' 
               : 'All our branches listed above belong directly to the Textile Industries Association, ensuring you receive authentic certified products with craftsmanship quality guarantee.'}
           </p>
        </div>
      </div>
    </div>
  );
}
