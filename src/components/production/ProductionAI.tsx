'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  Loader2, 
  Box,
  Wallet,
  Users2,
  Truck,
  Trophy,
  Search,
  BarChart3,
  History,
  TrendingUp,
  AlertTriangle,
  Receipt,
  RefreshCcw
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/components/LanguageProvider';
import { askAssociationAssistant } from '@/ai/flows/association-assistant';
import { cn } from '@/lib/utils';

type Message = {
  role: 'assistant' | 'user';
  content: string;
};

interface ProductionAIProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductionAI({ isOpen, onClose }: ProductionAIProps) {
  const { lang, dir } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRtl = lang === 'ar';

  const welcomeMessage = isRtl 
    ? "<h3>مرحباً بك يا مدير!</h3><p>أنا مستشارك التنفيذي. لقد قمتُ للتو بمسح كامل قاعدة البيانات؛ المخزون، أوامر الإنتاج، السندات، والعمال تحت تصرفك الآن. كيف يمكنني تحليل البيانات لك اليوم؟</p>"
    : "<h3>Welcome Manager!</h3><p>I am your executive consultant. I have scanned the entire database; inventory, orders, vouchers, and workforce are at your service. How can I analyze the data for you today?</p>";

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, [isOpen, welcomeMessage, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const userQuery = customText || input.trim();
    if (!userQuery || isLoading) return;

    const updatedMessages: Message[] = [...messages, { role: 'user', content: userQuery }];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await askAssociationAssistant({ 
        message: userQuery,
        history: messages 
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "<h3>❌ خطأ في النظام</h3><p>عذراً يا مدير، واجهت مشكلة في تحليل البيانات الحية حالياً. يرجى المحاولة لاحقاً.</p>" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: isRtl ? 'المخزون والنواقص' : 'Stock Check', icon: <Box className="w-3.5 h-3.5" />, text: isRtl ? 'أعطني جدولاً بكافة المواد الخام المتوفرة وما هي المواد التي رصيدها منخفض حالياً؟' : 'Show me a table of all raw materials and identify low stock items.' },
    { label: isRtl ? 'حالة الأوامر' : 'Order Status', icon: <BarChart3 className="w-3.5 h-3.5" />, text: isRtl ? 'لخص لي حالة كافة أوامر الإنتاج النشطة ونسبة المنجز النهائي منها.' : 'Summarize all active production orders and final yield.' },
    { label: isRtl ? 'التقرير المالي' : 'Financials', icon: <Wallet className="w-3.5 h-3.5" />, text: isRtl ? 'ما هو إجمالي الأجور المستحقة وإجمالي المصاريف التشغيلية المسجلة في السندات؟' : 'Total due wages and overhead expenses?' },
    { label: isRtl ? 'أفضل عامل' : 'Top Artisan', icon: <Trophy className="w-3.5 h-3.5" />, text: isRtl ? 'من هو العامل الأكثر إنتاجاً بناءً على إجمالي كميات الاستلام في السجلات؟' : 'Who is the top producing artisan based on receipts?' },
    { label: isRtl ? 'جرد المستودع' : 'Warehouse', icon: <Truck className="w-3.5 h-3.5" />, text: isRtl ? 'ما هي المنتجات الجاهزة المتوفرة في المستودع حالياً وكم كمياتها؟' : 'What finished goods are available in the warehouse?' },
    { label: isRtl ? 'تحليل التكاليف' : 'Cost Analysis', icon: <TrendingUp className="w-3.5 h-3.5" />, text: isRtl ? 'اعطني جدولاً بتكاليف المواد والأجور لكل أمر إنتاج نشط.' : 'Provide a table of material and wage costs per active order.' },
    { label: isRtl ? 'بحث في السندات' : 'Voucher Search', icon: <Search className="w-3.5 h-3.5" />, text: isRtl ? 'ابحث في آخر 50 سنداً وأخبرني بتفاصيل أي سند يحتوي على صرف مادة محددة أو مبلغ كبير.' : 'Search last 50 vouchers for specific items or high amounts.' },
    { label: isRtl ? 'أوامر متعثرة' : 'Delayed Batches', icon: <AlertTriangle className="w-3.5 h-3.5" />, text: isRtl ? 'هل هناك أوامر إنتاج نسبة إنجازها منخفضة جداً مقارنة بتاريخ بدئها؟' : 'Are there any production orders with very low progress?' },
    { label: isRtl ? 'سجل العمال' : 'Workforce', icon: <Users2 className="w-3.5 h-3.5" />, text: isRtl ? 'اعطني قائمة بالمشرفين والعمال النشطين حالياً موزعين حسب الأقسام.' : 'List of supervisors and active workers by department.' },
    { label: isRtl ? 'تفاصيل المرتجعات' : 'Returns Log', icon: <RefreshCcw className="w-3.5 h-3.5" />, text: isRtl ? 'اعطني جدولاً بكافة المواد الخام التي تم إرجاعها للمخزن مؤخراً.' : 'Show me a table of all recently returned raw materials.' },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side={isRtl ? "left" : "right"} 
        className="w-full sm:max-w-[650px] p-0 border-none flex flex-col bg-white dark:bg-slate-950 shadow-2xl transition-colors duration-300"
      >
        <div className="premium-gradient p-6 text-white shrink-0 relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.05] pointer-events-none">
              <img src="/images/logo.png" alt="watermark" className="w-full h-full object-contain grayscale brightness-0 invert" />
           </div>

           <SheetHeader className={cn("text-right relative z-10")}>
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center border border-white/20 shadow-xl p-1 shrink-0 overflow-hidden">
                 <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
               </div>
               <div className="flex flex-col text-right">
                 <SheetTitle className="text-xl font-black text-white">{isRtl ? 'مساعد الإنتاج الذكي' : 'Production AI'}</SheetTitle>
                 <div className="text-[10px] font-black text-emerald-200/60 uppercase tracking-widest mt-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   {isRtl ? 'رؤية تنفيذية كاملة' : 'Full Executive Visibility'}
                 </div>
               </div>
             </div>
           </SheetHeader>
           <button onClick={onClose} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors">
             <X className="w-6 h-6" />
           </button>
        </div>

        <ScrollArea dir={dir} className="flex-1 p-6 no-scrollbar bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
           <div className="space-y-6 flex flex-col">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col max-w-[95%] animate-in fade-in slide-in-from-bottom-2 duration-500",
                  msg.role === 'assistant' ? "self-start items-start" : "self-end items-end"
                )}>
                  <div 
                    className={cn(
                      "p-4 rounded-2xl text-[13px] md:text-sm leading-relaxed font-medium shadow-sm border overflow-hidden",
                      msg.role === 'assistant' 
                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-tr-none text-right" 
                        : "bg-emerald-600 text-white border-emerald-700 rounded-tl-none text-left"
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-table:my-2" dangerouslySetInnerHTML={{ __html: msg.content }} />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex flex-col self-start items-start animate-pulse">
                   <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 text-emerald-600 border border-slate-200 dark:border-slate-800 rounded-tr-none w-24 h-10 flex items-center justify-center">
                     <Loader2 className="w-4 h-4 animate-spin" />
                   </div>
                </div>
              )}
              <div ref={scrollRef} />
           </div>
        </ScrollArea>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 transition-colors duration-300">
           <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2 scroll-smooth">
              {quickActions.map((action, i) => (
                <Button 
                  key={i} 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSend(undefined, action.text)}
                  disabled={isLoading}
                  className="rounded-full h-8 px-4 text-[10px] font-black border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0 gap-2 transition-all hover:scale-105"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
           </div>

           <form onSubmit={handleSend} className="relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRtl ? "اطلب تقريراً، ابحث في السندات، أو اسأل عن العمال..." : "Request report, search vouchers, or ask about staff..."}
                className={cn(
                  "h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-slate-100 transition-all shadow-inner",
                  isRtl ? "pr-5 pl-14 text-right" : "pl-5 pr-14 text-left"
                )}
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full premium-gradient text-white border-none shadow-lg transition-all active:scale-90",
                  isRtl ? "left-2" : "right-2"
                )}
              >
                <Send className={cn("w-4 h-4", isRtl ? "rotate-[180deg]" : "")} />
              </Button>
           </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
