'use client';

import React, { useMemo } from 'react';
import { useTranslation } from '@/components/LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { MapPin, Phone, Building2, Globe, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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
      return timeA - timeB; // الأقدم أولاً كما في نظام الإنتاج
    });
  }, [rawBranches]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* الخلفية الزخرفية الموحدة */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none textile-pattern" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 -mr-64 -mt-64" />
      
      {/* رأس الصفحة بتصميم مطابق للواجهات الأخرى */}
      <div className="py-12 md:py-20 bg-primary relative text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 104l-30-17.321L0 104V69.359L30 52l30 17.359V104zm0-69.359L30 17.321 0 34.641V0l30 17.321L60 0v34.641z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 138px'
          }} 
        />
        
        <div className="container mx-auto px-4 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 mx-auto">
            <Globe className="h-3 w-3" />
            {isRtl ? 'شبكة معارضنا المعتمدة' : 'OUR AUTHORIZED NETWORK'}
          </div>
          <h1 className="text-3xl md:text-6xl font-black leading-tight drop-shadow-2xl">
            {t.nav.branches}
          </h1>
          <p className="text-sm md:text-lg opacity-80 max-w-2xl mx-auto font-medium leading-relaxed">
            {isRtl 
              ? 'نحن متواجدون في أهم المراكز التجارية لنكون أقرب إليكم دائماً بمنتجاتنا التراثية الأصيلة.' 
              : 'We are present in major commercial centers to always be closer to you with our authentic heritage products.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-24 max-w-7xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-black text-primary animate-pulse">{isRtl ? 'جاري جلب المواقع...' : 'Loading locations...'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
            {branches.map((branch) => (
              <div key={branch.id} className="group bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                {/* قسم الصورة */}
                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                  <img 
                    src={branch.photoUrl || `https://picsum.photos/seed/${branch.id}/800/600`} 
                    alt={branch.nameAr} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-primary hover:bg-white backdrop-blur-md border-none font-black shadow-lg text-[8px] md:text-[10px]">
                      {isRtl ? 'معتمد' : 'Authorized'}
                    </Badge>
                  </div>
                </div>

                {/* قسم المحتوى - RTL */}
                <div className="p-4 md:p-6 flex flex-col flex-1 space-y-4 text-right" dir="rtl">
                  <h2 className="text-xs md:text-lg font-black text-foreground flex items-center gap-2 justify-start group-hover:text-primary transition-colors">
                    <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {branch.nameAr}
                  </h2>
                  
                  <div className="flex-1">
                    <div className="flex items-start gap-2 text-muted-foreground justify-start">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] md:text-sm font-medium leading-relaxed line-clamp-2">
                        {branch.addressAr}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center gap-2 justify-start mt-auto">
                    <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="text-[10px] md:text-base font-black tabular-nums tracking-tighter">{branch.phoneNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* تذيل الصفحة الإرشادي */}
        <div className="mt-16 md:mt-24 p-8 md:p-12 bg-muted/30 rounded-2xl border border-dashed border-border/50 text-center space-y-4">
           <ShieldCheck className="w-12 h-12 text-primary/30 mx-auto" />
           <h3 className="text-xl font-black">{isRtl ? 'ضمان الجودة والأصالة' : 'Quality & Authenticity'}</h3>
           <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
             {isRtl 
               ? 'جميع فروعنا المذكورة أعلاه تتبع مباشرة لجمعية الصناعات النسيجية، وتضمن لكم الحصول على المنتجات الأصلية المعتمدة بضمان الجودة الحرفية.' 
               : 'All our branches listed above belong directly to the Textile Industries Association, ensuring you receive authentic certified products with craftsmanship quality guarantee.'}
           </p>
           <div className="pt-4">
              <Link href="/contact" className="text-primary font-black text-xs md:text-sm hover:underline flex items-center justify-center gap-2">
                {isRtl ? 'هل تحتاج إلى مساعدة في الوصول؟' : 'Need help with directions?'}
                <ChevronRight className={cn("w-4 h-4", isRtl ? "rotate-180" : "")} />
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
