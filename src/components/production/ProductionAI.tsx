'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  X, 
  User, 
  Loader2, 
  MessageCircle,
  HelpCircle,
  Zap,
  ShieldCheck,
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
    ? "مرحباً بك! أنا مساعد الإنتاج الذكي الخاص بجمعية الصناعات النسيجية. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن تاريخ الجمعية، مراحل الإنتاج، أو أنواع المعاوز."
    : "Welcome! I am the AI Production Assistant for the Textile Association. How can I help you today? Ask me about history, production stages, or Maawiz types.";

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

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const response = await askAssociationAssistant({ query: userQuery });
      setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
    } catch (error) {
      console.error('AI Assistant Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: isRtl ? "عذراً، حدث خطأ أثناء الاتصال بالخادم الذكي. يرجى المحاولة مرة أخرى." : "Sorry, an error occurred. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side={isRtl ? "left" : "right"} 
        className="w-full sm:max-w-[500px] p-0 border-none flex flex-col bg-white dark:bg-slate-950 shadow-2xl transition-colors duration-300"
      >
        {/* PREMIUM AI HEADER */}
        <div className="premium-gradient p-6 text-white shrink-0 relative overflow-hidden">
           {/* BRAND WATERMARK - LOGO INSTEAD OF SPARKLES */}
           <div className="absolute top-0 right-0 p-4 opacity-5">
              <img src="/images/logo.png" alt="watermark" className="w-40 h-40 object-contain grayscale brightness-0 invert" />
           </div>

           <SheetHeader className={cn("text-right rtl:text-right ltr:text-left relative z-10")}>
             <div className="flex items-center gap-3">
               {/* SHARPER LOGO CONTAINER FOR THE BOT ICON */}
               <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-white/20 shadow-xl p-1 shrink-0">
                 <img src="/images/logo.png" alt="Logo" className="w-full h-full object-contain" />
               </div>
               <div>
                 <SheetTitle className="text-xl font-black text-white">{isRtl ? 'مساعد الإنتاج الذكي' : 'Production AI'}</SheetTitle>
                 <div className="text-[10px] font-black text-emerald-200/60 uppercase tracking-widest mt-1 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   Powered by Gemini AI • TIA System
                 </div>
               </div>
             </div>
           </SheetHeader>
           <button onClick={onClose} className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors rtl:right-auto rtl:left-6 ltr:left-auto ltr:right-6">
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* CHAT MESSAGES AREA */}
        <ScrollArea className="flex-1 p-6 no-scrollbar bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
           <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-500",
                  msg.role === 'user' ? (isRtl ? "mr-auto items-start" : "ml-auto items-end") : (isRtl ? "ml-auto items-end" : "mr-auto items-start")
                )}>
                  <div className={cn(
                    "flex items-center gap-2 mb-1.5",
                    msg.role === 'user' ? "flex-row" : "flex-row-reverse"
                  )}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {msg.role === 'user' ? (isRtl ? 'أنت' : 'YOU') : (isRtl ? 'المساعد الذكي' : 'AI ASSISTANT')}
                    </span>
                    <div className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center text-[10px]",
                      msg.role === 'user' ? "bg-slate-200 dark:bg-slate-800 text-slate-500" : "bg-emerald-600 text-white"
                    )}>
                      {msg.role === 'user' ? <User className="w-3 h-3" /> : <div className="w-3 h-3"><img src="/images/logo.png" className="w-full h-full object-contain brightness-0 invert" /></div>}
                    </div>
                  </div>
                  
                  <div className={cn(
                    "p-4 rounded-2xl text-xs md:text-sm leading-relaxed font-bold shadow-sm border",
                    msg.role === 'user' 
                      ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 rounded-tr-none" 
                      : "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/30 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={cn("flex flex-col items-end max-w-[85%] ml-auto animate-pulse")}>
                   <div className="flex items-center gap-2 mb-1.5 flex-row-reverse">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">جاري التفكير...</span>
                      <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-white">
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                   </div>
                   <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/5 text-emerald-900/40 dark:text-emerald-400/40 border border-emerald-100/50 dark:border-emerald-900/20 rounded-tl-none w-32 h-10" />
                </div>
              )}
              <div ref={scrollRef} />
           </div>
        </ScrollArea>

        {/* QUICK SUGGESTIONS */}
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 overflow-x-auto flex gap-2 no-scrollbar">
           {[
             { ar: "متى تأسست الجمعية؟", en: "When was it founded?" },
             { ar: "ما هي مراحل الإنتاج؟", en: "Production stages?" },
             { ar: "أنواع المعاوز", en: "Maawiz types" }
           ].map((s, i) => (
             <button 
               key={i} 
               onClick={() => { setInput(isRtl ? s.ar : s.en); }}
               className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all uppercase tracking-tighter"
             >
               {isRtl ? s.ar : s.en}
             </button>
           ))}
        </div>

        {/* CHAT INPUT AREA */}
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 transition-colors duration-300">
           <form onSubmit={handleSend} className="relative">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRtl ? "اكتب سؤالك هنا..." : "Ask anything..."}
                className={cn(
                  "h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-slate-100 transition-all",
                  isRtl ? "pr-5 pl-14" : "pl-5 pr-14"
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
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className={cn("w-4 h-4", isRtl && "rotate-[225deg]")} />
                )}
              </Button>
           </form>
           <p className="text-[8px] font-bold text-slate-400 dark:text-slate-600 text-center mt-3 uppercase tracking-widest">
             TIA AI Engine v1.0 • Answers based on official archive
           </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
