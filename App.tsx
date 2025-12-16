
import React, { useState, useEffect, useRef } from 'react';
import { 
  Message, 
  Sender, 
  AppMode, 
  Product,
  Language,
  WishlistItem
} from './types';
import { 
  generateChatResponseStream, 
  searchProducts
} from './services/geminiService';
import { 
  MODEL_FLASH, 
  MODEL_FLASH_LITE, 
  SYSTEM_INSTRUCTIONS,
  EDUCATION_DATA,
  SHOPPING_DATA,
  UI_TRANSLATIONS
} from './constants';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { 
  Menu, Send, Sparkles, 
  ShoppingBag, GraduationCap, Moon, Sun,
  Loader2, Camera, MonitorPlay, PanelLeftClose, PanelLeftOpen,
  ExternalLink, Youtube, Copy, Check, X, Filter, ArrowUpDown, Scale,
  Mic, Heart, MapPin, Globe, ShieldCheck, AlertTriangle, ThumbsUp, ThumbsDown
} from 'lucide-react';

export default function App() {
  // Global State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [showSidebar, setShowSidebar] = useState(true); 
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState<Language>('en'); // Global Language
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Shopping State
  const [shoppingQuery, setShoppingQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [activeShopTab, setActiveShopTab] = useState<'search' | 'wishlist'>('search');
  const [isListening, setIsListening] = useState(false); // Voice Search

  // Filters
  const [sortOption, setSortOption] = useState<'price-asc' | 'price-desc' | 'rating' | 'relevance'>('relevance');
  const [minRating, setMinRating] = useState(0);
  const [minTrustScore, setMinTrustScore] = useState(0);
  const [showGlobalOnly, setShowGlobalOnly] = useState(false);
  
  // Toggles
  const [enableSearch, setEnableSearch] = useState(false); 
  
  // Attachments (Image)
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const t = UI_TRANSLATIONS[language]; // Translations shortcut

  // Load Wishlist from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('arise_wishlist');
    if (saved) setWishlist(JSON.parse(saved));
  }, []);

  // Save Wishlist
  useEffect(() => {
    localStorage.setItem('arise_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, mode]);

  // Theme Toggle
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Filter Logic
  useEffect(() => {
    let result = [...products];
    if (minRating > 0) result = result.filter(p => p.rating >= minRating);
    if (minTrustScore > 0) result = result.filter(p => (p.trustScore || 0) >= minTrustScore);
    if (showGlobalOnly) result = result.filter(p => !!p.globalPrice);

    if (sortOption === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortOption === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortOption === 'rating') result.sort((a, b) => b.rating - a.rating);
    setFilteredProducts(result);
  }, [products, minRating, sortOption, minTrustScore, showGlobalOnly]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        data: (reader.result as string).split(',')[1],
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice search not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.start();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  const toggleWishlist = (p: Product) => {
    if (wishlist.find(w => w.id === p.id)) {
      setWishlist(prev => prev.filter(w => w.id !== p.id));
    } else {
      setWishlist(prev => [...prev, { ...p, addedAt: Date.now() }]);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading || isSearchingProducts) return;

    // --- Supercharged Shopping Mode ---
    if (mode === AppMode.Shopping) {
      const query = input.trim() || "Identify this product";
      setShoppingQuery(query);
      setInput('');
      setIsSearchingProducts(true);
      setActiveShopTab('search');
      setProducts([]); 
      
      try {
        const results = await searchProducts(query, attachment?.data, language);
        setProducts(results);
      } catch (e) {
        console.error("Product search failed", e);
      } finally {
        setIsSearchingProducts(false);
        setAttachment(null);
      }
      return;
    }

    // --- Chat Logic ---
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: input,
      imageUrl: attachment ? `data:${attachment.mimeType};base64,${attachment.data}` : undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        let model = MODEL_FLASH_LITE;
        let systemInstruction = SYSTEM_INSTRUCTIONS[MODEL_FLASH_LITE];

        if (mode === AppMode.Education) {
          model = MODEL_FLASH;
          systemInstruction = SYSTEM_INSTRUCTIONS.EDUCATION;
        } else if (enableSearch) model = MODEL_FLASH;

        const botId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: botId, sender: Sender.Bot, text: "", isTyping: true, timestamp: Date.now()
        }]);

        const history = messages.map(m => ({
            role: m.sender === Sender.User ? 'user' : 'model',
            parts: m.imageUrl ? [{ text: m.text || "Image" }] : [{ text: m.text || "" }] 
        }));

        const finalMsg = `[Respond in ${language === 'bn' ? 'Bangla' : 'English'}] ${userMsg.text}`;

        const stream = await generateChatResponseStream(
          history,
          finalMsg,
          model,
          systemInstruction,
          attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
          enableSearch,
          false
        );

        let accumulatedText = "";
        let groundingData: any = { search: [], maps: [] };

        for await (const chunk of stream) {
           accumulatedText += (chunk.text || "");
           const grounding = chunk.candidates?.[0]?.groundingMetadata;
           if (grounding?.groundingChunks) {
             grounding.groundingChunks.forEach((c: any) => {
                if (c.web?.uri && c.web?.title) {
                   if (!groundingData.search.some((s: any) => s.uri === c.web.uri)) {
                      groundingData.search.push({ title: c.web.title, uri: c.web.uri });
                   }
                }
             });
           }
           setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: accumulatedText, isTyping: false, groundingData } : m));
        }
    } catch (error: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: Sender.Bot, text: `Error: ${error.message}`, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
      setAttachment(null);
    }
  };

  const renderEducationView = () => (
    <div className="w-full max-w-5xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-700 rounded-3xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Education Hub</h2>
        <p className="text-emerald-50 text-lg max-w-2xl">Access Bangladesh's top EdTech platforms.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EDUCATION_DATA.map((item, idx) => (
          <div key={idx} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all flex flex-col">
            <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100 group-hover:text-emerald-600 mb-4">{item.name}</h3>
            <div className="mt-auto grid grid-cols-2 gap-3">
              <a href={item.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white transition-all"><ExternalLink size={16} /> Web</a>
              <a href={item.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-600 hover:text-white transition-all"><Youtube size={16} /> Tube</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProductCard = (p: Product) => (
    <div key={p.id} className={`group bg-white dark:bg-zinc-900 border ${p.scamWarning ? 'border-red-500/50' : 'border-zinc-200 dark:border-zinc-800'} rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col relative`}>
       {p.isBestValue && (
         <div className="absolute top-0 left-0 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-10 shadow-sm">BEST VALUE</div>
       )}
       {p.scamWarning && (
         <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 shadow-sm flex items-center gap-1"><AlertTriangle size={10}/> SCAM RISK</div>
       )}
       
       <div className="relative w-full h-56 bg-white p-4 flex items-center justify-center">
         <img 
            src={p.image} 
            alt={p.title}
            onError={(e) => (e.target as HTMLImageElement).src = `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(p.title.substring(0,10))}`}
            className="max-w-full max-h-full object-contain" 
         />
         <div className="absolute top-3 left-3 flex flex-col gap-2">
            {p.trustScore !== undefined && (
                <div className={`p-1.5 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-1 ${p.trustScore > 80 ? 'bg-emerald-100/90 text-emerald-700' : p.trustScore > 50 ? 'bg-yellow-100/90 text-yellow-700' : 'bg-red-100/90 text-red-700'}`}>
                    <ShieldCheck size={14}/> {p.trustScore}%
                </div>
            )}
         </div>
         <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button 
              onClick={() => toggleWishlist(p)}
              className={`p-2 rounded-full backdrop-blur-md transition-colors ${wishlist.find(i => i.id === p.id) ? 'bg-rose-500 text-white' : 'bg-zinc-100/80 text-zinc-400 hover:text-rose-500'}`}
            >
              <Heart size={16} fill={wishlist.find(i => i.id === p.id) ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => {
                if (compareList.find(i => i.id === p.id)) setCompareList(prev => prev.filter(i => i.id !== p.id));
                else {
                  if (compareList.length >= 4) alert("Max 4 items");
                  else setCompareList(prev => [...prev, p]);
                }
              }}
              className={`p-2 rounded-full backdrop-blur-md transition-colors ${compareList.find(i => i.id === p.id) ? 'bg-brand-600 text-white' : 'bg-zinc-100/80 text-zinc-400 hover:text-brand-600'}`}
            >
              <Scale size={16} />
            </button>
         </div>
       </div>
       
       <div className="p-4 flex-1 flex flex-col">
         <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-2 py-1 rounded-md truncate max-w-[120px]">{p.seller}</span>
            <div className="flex items-center text-amber-500 text-xs font-bold gap-1">★ {p.rating}</div>
         </div>
         <h3 className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2 text-sm h-10">{p.title}</h3>
         
         <div className="space-y-1 mb-3">
             <div className="flex items-baseline gap-1">
               <span className="text-lg font-bold text-zinc-900 dark:text-white">{p.currency} {p.price.toLocaleString()}</span>
             </div>
             {p.globalPrice && (
                 <div className="text-xs text-zinc-500 flex items-center gap-1">
                     <Globe size={10}/> Global: {p.globalPrice.currency} {p.globalPrice.price.toLocaleString()}
                 </div>
             )}
         </div>

         {/* Pros/Cons Snippet */}
         {(p.pros || p.cons) && (
             <div className="flex gap-2 mb-3 text-[10px]">
                 {p.pros && <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ThumbsUp size={8}/> {p.pros[0]}</span>}
             </div>
         )}

         {/* Local Stores */}
         {p.nearbyStores && p.nearbyStores.length > 0 && (
             <div className="mb-3 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs">
                 <div className="font-semibold mb-1 flex items-center gap-1 text-zinc-700 dark:text-zinc-300"><MapPin size={10}/> Nearby</div>
                 <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>{p.nearbyStores[0].name}</span>
                    <span className="text-brand-600">{p.nearbyStores[0].distance}</span>
                 </div>
             </div>
         )}
         
         <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-auto w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-center text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
           {t.buy_now}
         </a>
       </div>
    </div>
  );

  const CompareModal = () => (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Scale className="text-brand-500"/> Product Comparison</h2>
          <button onClick={() => setShowCompareModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"><X/></button>
        </div>
        <div className="p-6 overflow-x-auto">
          <div className="grid grid-flow-col auto-cols-[300px] gap-6">
             <div className="space-y-4 font-semibold text-zinc-500 dark:text-zinc-400 py-4 min-w-[150px]">
               <div className="h-40">Image</div>
               <div>Price</div>
               <div>Rating</div>
               <div>Trust Score</div>
               <div>Global Price</div>
               <div>Pros</div>
               <div>Cons</div>
               <div>Action</div>
             </div>
             {compareList.map(p => (
               <div key={p.id} className="space-y-4 min-w-[300px]">
                 <div className="h-40 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2">
                    <img src={p.image} className="max-h-full max-w-full object-contain" alt={p.title}/>
                 </div>
                 <div className="font-bold text-xl">{p.currency} {p.price}</div>
                 <div className="flex items-center gap-1 text-amber-500 font-bold">★ {p.rating}</div>
                 <div className={`font-bold ${p.trustScore && p.trustScore > 80 ? 'text-emerald-500' : 'text-yellow-500'}`}>{p.trustScore}%</div>
                 <div className="text-sm">{p.globalPrice ? `${p.globalPrice.currency} ${p.globalPrice.price}` : 'N/A'}</div>
                 <div className="text-xs space-y-1">
                   {p.pros?.map((pro, i) => <div key={i} className="text-emerald-600 flex gap-1"><Check size={10} className="mt-0.5"/> {pro}</div>)}
                 </div>
                 <div className="text-xs space-y-1">
                   {p.cons?.map((con, i) => <div key={i} className="text-red-500 flex gap-1"><X size={10} className="mt-0.5"/> {con}</div>)}
                 </div>
                 <a href={p.link} target="_blank" className="block w-full py-2 bg-brand-600 text-white text-center rounded-lg text-sm font-bold">Buy Now</a>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${!showSidebar && 'md:!hidden'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 px-2 mb-8 mt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
              <Sparkles size={20} />
            </div>
            <div>
               <h1 className="text-xl font-bold tracking-tight">NAV.AI</h1>
               <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Supercharged</span>
            </div>
          </div>

          <nav className="space-y-2 flex-1">
            <button 
              onClick={() => { setMode(AppMode.Chat); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === AppMode.Chat ? 'bg-zinc-200 dark:bg-zinc-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'}`}
            >
              <Menu size={18} /> {t.home}
            </button>
            <button 
              onClick={() => { setMode(AppMode.Shopping); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === AppMode.Shopping ? 'bg-zinc-200 dark:bg-zinc-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'}`}
            >
              <ShoppingBag size={18} /> {t.shopping}
            </button>
            <button 
              onClick={() => { setMode(AppMode.Education); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${mode === AppMode.Education ? 'bg-zinc-200 dark:bg-zinc-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400'}`}
            >
              <GraduationCap size={18} /> {t.education}
            </button>
          </nav>

          <div className="mt-auto space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            {/* Language Toggle */}
            <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
               <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>English</button>
               <button onClick={() => setLanguage('bn')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${language === 'bn' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>বাংলা</button>
            </div>

            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-medium text-zinc-500">Appearance</span>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full max-w-full">
        {/* Header Mobile */}
        <header className="flex items-center justify-between p-4 md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-30">
           <div className="flex items-center gap-2">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2"><Menu size={20}/></button>
             <span className="font-bold text-lg">NAV.AI</span>
           </div>
        </header>

        {/* Desktop Toggle Sidebar */}
        <button 
           onClick={() => setShowSidebar(!showSidebar)}
           className="hidden md:flex absolute top-4 left-4 z-30 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
        >
           {showSidebar ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}
        </button>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth" ref={scrollRef}>
           
           {/* Modes */}
           {mode === AppMode.Education && renderEducationView()}

           {mode === AppMode.Shopping && (
             <div className="max-w-7xl mx-auto space-y-6">
                <div className="text-center space-y-2 mb-8">
                   <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-emerald-600">{t.shopping}</h1>
                   <p className="text-zinc-500 max-w-xl mx-auto">AI-powered search, price comparison, scam detection, and local store finder.</p>
                </div>
                
                {/* Shopping Search Bar */}
                <div className="relative max-w-2xl mx-auto">
                    <div className="flex gap-2 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-lg focus-within:ring-2 ring-brand-500/50 transition-all">
                       <button onClick={handleVoiceSearch} className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'}`}>
                          <Mic size={20}/>
                       </button>
                       <input 
                         type="text" 
                         value={input}
                         onChange={(e) => setInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                         placeholder={t.shopping_placeholder}
                         className="flex-1 bg-transparent border-none focus:outline-none text-base"
                       />
                       <label className="cursor-pointer p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors">
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload}/>
                          <Camera size={20}/>
                       </label>
                       <button 
                         onClick={handleSend}
                         disabled={isLoading || isSearchingProducts}
                         className="bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
                       >
                         {isSearchingProducts ? <Loader2 className="animate-spin"/> : <Send size={20}/>}
                       </button>
                    </div>
                    {attachment && (
                      <div className="absolute top-full mt-2 left-0 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center gap-2 text-xs">
                        <span className="font-mono text-zinc-500">Image attached</span>
                        <button onClick={() => setAttachment(null)} className="hover:text-red-500"><X size={12}/></button>
                      </div>
                    )}
                </div>

                {/* Shopping Tabs & Controls */}
                {products.length > 0 && (
                   <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
                      <div className="flex gap-2">
                         <button onClick={() => setActiveShopTab('search')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeShopTab === 'search' ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' : 'text-zinc-500'}`}>Results ({products.length})</button>
                         <button onClick={() => setActiveShopTab('wishlist')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeShopTab === 'wishlist' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'text-zinc-500'}`}>Wishlist ({wishlist.length})</button>
                      </div>
                      
                      {compareList.length > 0 && (
                        <button onClick={() => setShowCompareModal(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition-transform">
                           <Scale size={16}/> Compare ({compareList.length})
                        </button>
                      )}

                      <div className="flex items-center gap-2">
                         <select 
                           value={sortOption} 
                           onChange={(e: any) => setSortOption(e.target.value)}
                           className="bg-transparent text-sm font-medium text-zinc-500 border-none focus:ring-0 cursor-pointer"
                         >
                            <option value="relevance">Relevance</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                         </select>
                         <button onClick={() => setShowGlobalOnly(!showGlobalOnly)} className={`p-2 rounded-lg ${showGlobalOnly ? 'bg-brand-100 text-brand-700' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`} title="Global Price Only">
                            <Globe size={18}/>
                         </button>
                      </div>
                   </div>
                )}

                {/* Product Grid */}
                {activeShopTab === 'search' ? (
                   isSearchingProducts ? (
                     <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="w-10 h-10 text-brand-500 animate-spin"/>
                        <p className="text-zinc-400 animate-pulse">Scanning global stores & local markets...</p>
                     </div>
                   ) : products.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProducts.map(renderProductCard)}
                     </div>
                   ) : shoppingQuery && !isSearchingProducts ? (
                      <div className="text-center py-20 text-zinc-500">
                         <ShoppingBag size={48} className="mx-auto mb-4 opacity-20"/>
                         <p>{t.no_results}</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 opacity-50 pointer-events-none filter blur-sm select-none">
                         {/* Placeholder Grid background */}
                         {Array.from({length: 12}).map((_, i) => (
                           <div key={i} className="h-48 bg-zinc-100 dark:bg-zinc-900 rounded-xl"></div>
                         ))}
                      </div>
                   )
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     {wishlist.length === 0 ? <p className="col-span-full text-center py-10 text-zinc-500">Wishlist is empty.</p> : wishlist.map(renderProductCard)}
                  </div>
                )}
             </div>
           )}

           {mode === AppMode.Chat && (
             <div className="max-w-3xl mx-auto pb-24">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-500/30 mb-4 animate-in zoom-in duration-500">
                       <Sparkles className="text-white w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">How can I help you today?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                       {["What are the top skills to learn in 2025?", "Compare iPhone 16 vs Samsung S25", "Plan a budget trip to Cox's Bazar", "Write a polite email to my boss"].map((suggestion, i) => (
                         <button key={i} onClick={() => setInput(suggestion)} className="text-left text-sm p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-brand-50 dark:hover:bg-brand-900/10 border border-zinc-200 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-brand-800 transition-all">
                            {suggestion}
                         </button>
                       ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                     {messages.map((msg, idx) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                           {msg.sender === Sender.Bot && (
                             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md mt-1">
                               AI
                             </div>
                           )}
                           <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${msg.sender === Sender.User ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-br-sm' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-bl-sm'}`}>
                              {msg.imageUrl && (
                                <img src={msg.imageUrl} alt="Uploaded" className="max-w-full h-auto rounded-lg mb-3 border border-white/20"/>
                              )}
                              
                              {msg.isTyping ? (
                                <div className="flex gap-1.5 py-2">
                                  <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                  <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                  <span className="w-2 h-2 bg-current rounded-full animate-bounce"></span>
                                </div>
                              ) : (
                                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                                  <MarkdownRenderer content={msg.text || ""} />
                                </div>
                              )}

                              {/* Grounding Chips */}
                              {msg.groundingData && msg.groundingData.search && msg.groundingData.search.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50">
                                   {msg.groundingData.search.slice(0, 3).map((g, i) => (
                                      <a key={i} href={g.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-zinc-100 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-zinc-600 dark:text-zinc-400 hover:text-brand-600 px-2 py-1 rounded-full flex items-center gap-1 transition-colors">
                                        <ExternalLink size={10}/> {g.title}
                                      </a>
                                   ))}
                                </div>
                              )}

                              {/* Message Actions */}
                              {!msg.isTyping && (
                                <div className={`absolute ${msg.sender === Sender.User ? '-left-8' : '-right-8'} top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                                   <button onClick={() => handleCopy(msg.text || "", msg.id)} className="p-1.5 text-zinc-400 hover:text-brand-500 bg-white dark:bg-zinc-800 rounded-full shadow-sm">
                                      {copiedMessageId === msg.id ? <Check size={12}/> : <Copy size={12}/>}
                                   </button>
                                </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
                )}
             </div>
           )}
        </main>

        {/* Input Area (Chat Mode Only) */}
        {mode === AppMode.Chat && (
          <div className="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
             <div className="max-w-3xl mx-auto relative">
                {attachment && (
                  <div className="absolute bottom-full mb-2 left-0 p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 shadow-lg animate-in slide-in-from-bottom-2">
                     <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-200">
                        <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="w-full h-full object-cover" />
                     </div>
                     <button onClick={() => setAttachment(null)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full"><X size={14}/></button>
                  </div>
                )}
                <div className="flex gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm focus-within:ring-2 ring-brand-500/50 transition-all">
                    <button 
                      onClick={() => setEnableSearch(!enableSearch)}
                      className={`p-2.5 rounded-xl transition-all ${enableSearch ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                      title="Toggle Web Search"
                    >
                      <Globe size={20}/>
                    </button>
                    <label className="cursor-pointer p-2.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-colors">
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload}/>
                        <Camera size={20}/>
                    </label>
                    <textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={t.search_placeholder}
                      className="flex-1 bg-transparent border-none focus:outline-none resize-none py-2.5 max-h-32 text-sm"
                      rows={1}
                    />
                    <button 
                      onClick={handleSend}
                      disabled={isLoading || (!input.trim() && !attachment)}
                      className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:hover:bg-brand-600 text-white p-2.5 rounded-xl transition-all shadow-sm"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                    </button>
                </div>
                <div className="text-center mt-2">
                   <p className="text-[10px] text-zinc-400">AI can make mistakes. Verify important info.</p>
                </div>
             </div>
          </div>
        )}

        {/* Modals */}
        {showCompareModal && <CompareModal />}

      </div>
    </div>
  );
}