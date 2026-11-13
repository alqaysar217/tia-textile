'use client';

import { Hero } from '@/components/Hero';
import { StatsSection } from '@/components/StatsSection';
import { Features } from '@/components/Features';
import { CategoriesSection } from '@/components/CategoriesSection';
import { useTranslation } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { FAQ } from '@/components/FAQ';
import { Testimonials } from '@/components/Testimonials';
import { BranchesSection } from '@/components/BranchesSection';

export default function Home() {
  const { lang, t } = useTranslation();

  // Featured Maawiz products
  const featuredProducts = [
    {
      id: '1',
      nameAr: 'معوز ملكي فاخر - نقشة خاصة',
      nameEn: 'Premium Royal Maawiz - Special Pattern',
      price: 15000,
      originalPrice: 18000,
      categoryAr: 'ملكي',
      categoryEn: 'Royal',
      image: 'https://picsum.photos/seed/m1/600/800',
      status: 'available',
      isNew: true
    },
    {
      id: '2',
      nameAr: 'معوز حليسي كلاسيك - يدوي',
      nameEn: 'Classic Halisi Maawiz - Handmade',
      price: 12000,
      categoryAr: 'حليسي',
      categoryEn: 'Halisi',
      image: 'https://picsum.photos/seed/m2/600/800',
      status: 'available'
    },
    {
      id: '3',
      nameAr: 'معوز بيضاني - شغل ممتاز',
      nameEn: 'Baidani Maawiz - Excellent Work',
      price: 14000,
      categoryAr: 'بيضاني',
      categoryEn: 'Baidani',
      image: 'https://picsum.photos/seed/m3/600/800',
      status: 'available'
    },
    {
      id: '5',
      nameAr: 'معوز سلاطيني - نخب أول',
      nameEn: 'Salateeni Maawiz - Grade A',
      price: 18000,
      categoryAr: 'سلاطيني',
      categoryEn: 'Salateeni',
      image: 'https://picsum.photos/seed/m5/600/800',
      status: 'available',
      isNew: true
    }
  ];

  return (
    <div className="space-y-0">
      <Hero />
      
      <StatsSection />
      
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12 space-y-2 md:space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-primary">{t.products.title}</h2>
            <p className="text-muted-foreground text-xs md:text-lg font-medium">{t.products.subtitle}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 md:mt-12 text-center">
            <Button size="lg" variant="outline" className="w-full md:w-auto px-10 rounded-full h-12 md:h-14 text-base font-bold border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-lg" asChild>
              <Link href="/products">{t.products.viewAll}</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="bg-muted/30">
        <Features />
      </div>

      <section className="py-12 md:py-24 bg-primary text-primary-foreground overflow-hidden relative">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 104l-30-17.321L0 104V69.359L30 52l30 17.359V104zm0-69.359L30 17.321 0 34.641V0l30 17.321L60 0v34.641z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '80px 138px'
          }} 
        />
        
        {/* Subtle Geometric accents */}
        <svg className="absolute top-0 right-0 h-full w-1/3 opacity-10 text-white" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="0,0 100,0 100,100" fill="currentColor" />
        </svg>
        
        {/* Regulated Hexagonal accents */}
        <div className="absolute top-10 left-10 w-20 h-20 opacity-10 border border-white/40" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
        <div className="absolute bottom-10 right-10 w-32 h-32 opacity-10 border border-white/40" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-20 items-center">
            <div className="relative aspect-video md:aspect-[4/3] w-full max-w-xl mx-auto overflow-hidden rounded-[2rem] shadow-2xl border-4 border-white/10 group">
              <img 
                src="/images/history-1.png" 
                alt="Association Heritage" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
            </div>
            
            <div className="space-y-6 md:space-y-10 text-center lg:text-right rtl:lg:text-right ltr:lg:text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] md:text-xs font-black uppercase tracking-widest border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  {lang === 'ar' ? 'أصالة منذ 1973' : 'SINCE 1973'}
                </div>
                <h2 className="text-2xl md:text-3xl font-black leading-tight drop-shadow-lg">
                  {t.about.historyTitle}
                </h2>
                <div className="space-y-4 md:space-y-6 text-sm md:text-xl text-primary-foreground/80 leading-relaxed font-medium">
                  <p>{t.about.content}</p>
                  <p>{t.about.historyContent}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Button size="lg" variant="secondary" className="w-full md:w-auto px-10 rounded-full h-12 md:h-16 text-sm md:text-lg font-black shadow-2xl hover:scale-105 transition-transform" asChild>
                  <Link href="/about">تعرف على قصتنا الكاملة</Link>
                </Button>
                <Button size="lg" className="w-full md:w-auto px-10 rounded-full h-12 md:h-16 text-sm md:text-lg font-black bg-white text-primary hover:bg-transparent hover:text-white hover:border hover:border-white transition-all shadow-xl" asChild>
                  <Link href="/contact">{t.nav.contact}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-muted/30">
        <CategoriesSection />
      </div>

      <BranchesSection />

      <Testimonials showViewMore={true} limit={3} />
      
      <div className="bg-background">
        <FAQ showViewMore={true} />
      </div>
    </div>
  );
}
