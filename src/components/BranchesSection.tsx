
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

  const staticBranches = [
    {
      id: 'static-1',
      nameAr: 'فرع عتق',
      addressAr: 'عتق - النصب - الشارع العام - امام بن روام للمواد الغذائية',
      phoneNumber: '77246479',
      photoUrl: 'https://picsum.photos/seed/branch-1/600/400'
    },
    {
      id: 'static-2',
      nameAr: 'فرع الروضة',
      addressAr: 'الروضة - الشارع العام - بجانب باعلي للصرافه',
      phoneNumber: '777295911',
      photoUrl: 'https://picsum.photos/seed/branch-2/600/400'
    },
    {
      id: 'static-3',
      nameAr: 'فرع المكلا',
      addressAr: 'المكلا - الشرج - الشارع الاول - بجانب مستوصف المدينة',
      phoneNumber: '777488522',
      photoUrl: 'https://picsum.photos/seed/branch-3/600/400'
    },
    {
      id: 'static-4',
      nameAr: 'فرع سيئون',
      addressAr: 'سيئون - جولة باحارثة - ممقابل مدرسة الشهيد الزبيدي',
      phoneNumber: '774027755',
      photoUrl: 'https://picsum.photos/seed/branch-4/600/400'
    }
  ];

  const branchesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'branches'),
      where('status', '==', 'active'),
      limit(10)
    );
  }, [db]);

  const { data: rawBranches, loading } = useCollection<any>(branchesQuery);

  const branchesToDisplay = useMemo(() => {
    if (rawBranches && rawBranches.length > 0) {
      return [...rawBranches]
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB; // Oldest first
        })
        .slice(0, 4);
    }
    return staticBranches;
  }, [rawBranches]);

  return (
    <section className="py-12 md:py-24 bg-background overflow-hidden border-t border-border/50">
      <div className="container mx-auto px-4">
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
            <Link href="/branches">
              {isRtl ? 'عرض كافة المواقع' : 'View All Locations'}
              {dir === 'rtl' ? <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {branchesToDisplay.map((branch) => (
            <div key={branch.id} className={cn(
              "group bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full",
              loading && branch.id.startsWith('static') && "opacity-80"
            )}>
              <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                <img 
                  src={branch.photoUrl} 
                  alt={branch.nameAr} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  data-ai-hint="store branch"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="p-4 md:p-6 flex flex-col flex-1 space-y-4 text-right" dir="rtl">
                <h3 className="font-black text-xs md:text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors flex items-center gap-2 justify-start">
                  <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {branch.nameAr}
                </h3>
                
                <div className="flex-1">
                  <div className="flex items-start gap-2 text-muted-foreground justify-start">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] md:sm font-medium line-clamp-2 leading-relaxed text-right">
                      {branch.addressAr}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center gap-2 justify-start">
                  <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-[10px] md:text-base font-black tabular-nums text-foreground tracking-tighter">
                    {branch.phoneNumber}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 md:hidden text-center">
          <Button variant="outline" className="w-full rounded-xl h-12 font-black text-primary border-primary/20" asChild>
            <Link href="/branches">
              {isRtl ? 'عرض كافة الفروع' : 'View All Branches'}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
