'use client';

import React, { useMemo } from 'react';
import { useTranslation } from './LanguageProvider';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { MapPin, Phone, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BranchesSection() {
  const { lang, dir } = useTranslation();
  const db = useFirestore();
  const isRtl = lang === 'ar';

  // جلب الفروع النشطة فقط من قاعدة البيانات - حد أقصى 4 للعرض في الرئيسية
  const branchesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'branches'),
      where('status', '==', 'active'),
      limit(4)
    );
  }, [db]);

  const { data: branches, loading } = useCollection<any>(branchesQuery);

  return (
    <section className="py-12 md:py-24 bg-background overflow-hidden border-t border-border/50">
      <div className="container mx-auto px-4">
        {/* Header - Now Centered */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 md:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
            <MapPin className="h-3 w-3" />
            {isRtl ? 'تجمعنا بكم فروعنا' : 'OUR LOCATIONS'}
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-foreground">
            {isRtl ? 'فروعنا ومعارضنا' : 'Our Branches'}
          </h2>
          <div className="w-20 h-1.5 bg-secondary rounded-full mx-auto" />
          <p className="text-muted-foreground text-sm md:text-lg font-medium">
            {isRtl 
              ? 'تفضلوا بزيارة معارضنا المعتمدة في محافظة شبوة لاكتشاف أجود أنواع المعاوز يدوية الصنع والمنسوجات التراثية.' 
              : 'Visit our authorized showrooms in Shabwah to discover the finest handmade Maawiz and traditional textiles.'}
          </p>
          
          <Button variant="ghost" className="font-black text-primary hover:bg-primary/5 gap-2 group hidden md:flex mt-2" asChild>
            <Link href="/contact">
              {isRtl ? 'عرض كافة المواقع' : 'View All Locations'}
              {dir === 'rtl' ? <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </Link>
          </Button>
        </div>

        {/* Grid: 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />
            ))
          ) : branches.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground font-bold border-2 border-dashed border-border/50 rounded-2xl bg-muted/5">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-10" />
              {isRtl ? 'جاري تحديث قائمة الفروع من الإدارة...' : 'Updating branch list...'}
            </div>
          ) : (
            branches.map((branch) => (
              <div key={branch.id} className="group bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full">
                {/* Branch Image */}
                <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                  {branch.photoUrl ? (
                    <img 
                      src={branch.photoUrl} 
                      alt={branch.nameAr} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <Building2 className="w-10 h-10 md:w-16 md:h-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Branch Content */}
                <div className="p-4 md:p-6 flex flex-col flex-1 space-y-3 text-right">
                  <h3 className="font-black text-xs md:text-xl text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {branch.nameAr}
                  </h3>
                  
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start gap-2 text-muted-foreground justify-start rtl:flex-row-reverse">
                      <MapPin className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-[10px] md:text-sm font-medium line-clamp-2 leading-relaxed text-right">
                        {branch.addressAr}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50 flex items-center gap-2 justify-start rtl:flex-row-reverse">
                    <Phone className="h-3 w-3 md:h-4 md:w-4 text-emerald-600 shrink-0" />
                    <span className="text-[10px] md:text-base font-black tabular-nums text-foreground tracking-tighter">
                      {branch.phoneNumber}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile View More Button */}
        <div className="mt-8 md:hidden text-center">
          <Button variant="outline" className="w-full rounded-xl h-12 font-black text-primary border-primary/20" asChild>
            <Link href="/contact">
              {isRtl ? 'عرض كافة الفروع' : 'View All Branches'}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}