
import React, { useState, useEffect, useRef } from 'react';
import { 
  Message, 
  Sender, 
  AppMode, 
  ImageGenerationConfig 
} from './types';
import { 
  generateChatResponseStream, 
  generateImage 
} from './services/geminiService';
import { 
  MODEL_FLASH, 
  MODEL_FLASH_LITE, 
  MODEL_PRO_THINKING, 
  SYSTEM_INSTRUCTIONS,
  EDUCATION_DATA,
  SHOPPING_DATA
} from './constants';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { ImageVideoControls } from './components/ImageVideoControls';
import { 
  Menu, Send, Image as ImageIcon, Sparkles, 
  ShoppingBag, GraduationCap, MapPin, Moon, Sun,
  Loader2, Camera, MonitorPlay, PanelLeftClose, PanelLeftOpen,
  ExternalLink, Youtube, Copy, Check, X
} from 'lucide-react';

export default function App() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile toggle
  const [showSidebar, setShowSidebar] = useState(true); // Desktop toggle
  const [darkMode, setDarkMode] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Features Toggles
  const [enableSearch, setEnableSearch] = useState(false); 
  // Fixed: Removed unused setEnableMaps setter to prevent build error
  const [enableMaps] = useState(false); 
  
  // Attachments
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
  
  // Generation Configs
  const [imgConfig, setImgConfig] = useState<ImageGenerationConfig>({
    prompt: "", aspectRatio: "1:1"
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, mode]);

  // Theme Toggle
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Helper: Convert file to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setAttachment({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle Copy
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
  };

  // Handle Send
  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

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
      // -- Image Generation Mode --
      if (mode === AppMode.ImageGen) {
        const genConfig = { 
          ...imgConfig, 
          prompt: input || imgConfig.prompt,
          imageBytes: attachment?.data, // Use attachment for edits
          mimeType: attachment?.mimeType
        };
        const imageUrl = await generateImage(genConfig);
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: Sender.Bot,
          imageUrl: imageUrl,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);
      }
      // -- Chat / Text Modes --
      else {
        let model = MODEL_FLASH_LITE;
        let systemInstruction = SYSTEM_INSTRUCTIONS[MODEL_FLASH_LITE];

        if (mode === AppMode.Thinking) {
          model = MODEL_PRO_THINKING;
        } else if (mode === AppMode.Education) {
          model = MODEL_FLASH;
          systemInstruction = SYSTEM_INSTRUCTIONS.EDUCATION;
        } else if (mode === AppMode.Shopping) {
          model = MODEL_FLASH;
          systemInstruction = SYSTEM_INSTRUCTIONS.SHOPPING;
        } else if (enableSearch || enableMaps) {
          model = MODEL_FLASH;
        }

        const botId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, {
            id: botId,
            sender: Sender.Bot,
            text: "",
            isTyping: true,
            timestamp: Date.now()
        }]);

        const history = messages.map(m => ({
            role: m.sender === Sender.User ? 'user' : 'model',
            parts: m.imageUrl ? [{ text: m.text || "Image" }] : [{ text: m.text || "" }] 
        }));

        const stream = await generateChatResponseStream(
          history,
          userMsg.text || "Process this content",
          model,
          systemInstruction,
          attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
          enableSearch,
          enableMaps,
          mode === AppMode.Thinking
        );

        let accumulatedText = "";
        let groundingData: any = { search: [], maps: [] };

        for await (const chunk of stream) {
           const text = chunk.text || "";
           accumulatedText += text;
           
           const grounding = chunk.candidates?.[0]?.groundingMetadata;
           if (grounding?.groundingChunks) {
             grounding.groundingChunks.forEach((c: any) => {
                if (c.web?.uri && c.web?.title) {
                   if (!groundingData.search.some((s: any) => s.uri === c.web.uri)) {
                      groundingData.search.push({ title: c.web.title, uri: c.web.uri });
                   }
                }
                if (c.maps?.sourcePlace?.uri) {
                   if (!groundingData.maps.some((m: any) => m.uri === c.maps.sourcePlace.uri)) {
                      groundingData.maps.push({ 
                        title: c.maps.sourcePlace.name || "Map Location", 
                        uri: c.maps.sourcePlace.uri 
                      });
                   }
                }
             });
           }

           setMessages(prev => prev.map(m => 
             m.id === botId ? { ...m, text: accumulatedText, isTyping: false, groundingData } : m
           ));
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: Sender.Bot,
        text: `Error: ${error.message || "Something went wrong."}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
      setAttachment(null);
    }
  };

  // Views
  const renderEducationView = () => (
    <div className="w-full max-w-5xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-700 rounded-3xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
               <GraduationCap size={32} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Education Hub</h2>
          </div>
          <p className="text-emerald-50 text-lg max-w-2xl">Access Bangladesh's top EdTech platforms. Learn, grow, and succeed with our curated resources.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EDUCATION_DATA.map((item, idx) => (
          <div key={idx} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.name}</h3>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3">
              <a 
                href={item.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all"
              >
                <ExternalLink size={16} /> Website
              </a>
              <a 
                href={item.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all"
              >
                <Youtube size={16} /> YouTube
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderShoppingView = () => (
    <div className="w-full max-w-5xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl"></div>
         <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <ShoppingBag size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Shopping Assistant</h2>
            </div>
            <p className="text-indigo-100 text-lg max-w-2xl">Find the best price rates and explore top local & international brands.</p>
         </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-5 flex items-center gap-2">
            <span className="text-2xl">🇧🇩</span> Top Bangladesh Brands
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {SHOPPING_DATA.local.map((item, idx) => (
              <a key={idx} href={item.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-violet-500 dark:hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/10 transition-all group">
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-violet-600 dark:group-hover:text-violet-400">{item.name}</span>
                <ExternalLink size={14} className="text-zinc-400 group-hover:text-violet-500 transition-colors" />
              </a>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-5 flex items-center gap-2">
            <span className="text-2xl">🌎</span> International Brands
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {SHOPPING_DATA.intl.map((item, idx) => (
              <a key={idx} href={item.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
                <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.name}</span>
                <ExternalLink size={14} className="text-zinc-400 group-hover:text-blue-500 transition-colors" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const ModeButton = ({ m, icon: Icon, label }: { m: AppMode, icon: any, label: string }) => (
    <button 
      onClick={() => { setMode(m); setIsSidebarOpen(false); setMessages([]); }} 
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        mode === m 
          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  // Calculate layout state
  const isCentered = messages.length === 0 && mode === AppMode.Chat;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-zinc-950 font-sans">
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
        transform transition-all duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative
        ${showSidebar ? 'w-72' : 'md:w-0 md:border-none md:overflow-hidden'} 
      `}>
        <div className="w-72 flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center space-x-2">
               {/* Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/20">
                A
              </div>
              <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">ARISE</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setShowSidebar(false)} 
                className="hidden md:flex p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4">
            <div className="px-4 pb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">Main Menu</div>
            <ModeButton m={AppMode.Chat} icon={MonitorPlay} label="Home / Chat" />
            <ModeButton m={AppMode.Education} icon={GraduationCap} label="Education Mode" />
            <ModeButton m={AppMode.Shopping} icon={ShoppingBag} label="Shopping Assistant" />
            
            <div className="mt-8 px-4 pb-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">Advanced Tools</div>
            <ModeButton m={AppMode.Thinking} icon={Sparkles} label="Deep Reasoning" />
            <ModeButton m={AppMode.ImageGen} icon={ImageIcon} label="Image Studio" />
          </nav>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
             <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center text-white text-xs font-bold">A</div>
                   <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Theme</span>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
             </div>
             <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500">
               dear user history is no here for your privacy
             </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-white dark:bg-zinc-950">
        
        {!showSidebar && (
          <div className="hidden md:block absolute top-4 left-4 z-20">
            <button 
              onClick={() => setShowSidebar(true)}
              className="p-2 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-brand-600 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm transition-colors"
            >
              <PanelLeftOpen size={20} />
            </button>
          </div>
        )}

        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
          <button onClick={() => setIsSidebarOpen(true)}><Menu className="text-zinc-600 dark:text-zinc-300" /></button>
          <span className="font-bold text-lg text-zinc-900 dark:text-white">ARISE</span>
          <div className="w-6"></div>
        </header>

        {/* Scrollable Area */}
        <div className={`flex-1 overflow-y-auto scroll-smooth ${isCentered ? 'flex flex-col justify-center items-center' : ''}`}>
           <div className={`w-full max-w-5xl mx-auto min-h-full flex flex-col ${isCentered ? 'justify-center' : 'p-4 md:p-8'}`}>
             
             {/* Welcome / Empty States */}
             {messages.length === 0 && mode === AppMode.Chat && (
                <div className="text-center px-4 mb-8 animate-in zoom-in-95 duration-500">
                   <div className="w-24 h-24 bg-gradient-to-tr from-brand-400 to-brand-600 rounded-3xl flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-brand-500/30">
                     <Sparkles className="text-white" size={48} />
                   </div>
                   <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">ARISE</h1>
                   <p className="text-xl text-zinc-500 dark:text-zinc-400">How can I help you today?</p>
                </div>
             )}

             {messages.length === 0 && mode === AppMode.Education && renderEducationView()}
             {messages.length === 0 && mode === AppMode.Shopping && renderShoppingView()}

             {/* Chat Messages */}
             <div className={`space-y-6 ${isCentered ? 'hidden' : 'block pb-24'}`}>
               {messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                   <div className={`group relative max-w-[90%] md:max-w-[75%] rounded-2xl p-5 shadow-sm ${
                     msg.sender === Sender.User 
                       ? 'bg-brand-600 text-white rounded-br-none' 
                       : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-bl-none'
                   }`}>
                      {msg.text && <MarkdownRenderer content={msg.text} />}
                      
                      {msg.imageUrl && (
                        <div className="mt-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          <img src={msg.imageUrl} alt="Generated" className="w-full h-auto max-h-96 object-contain bg-black" />
                        </div>
                      )}

                      {/* Grounding Search Results */}
                      {msg.groundingData?.search && msg.groundingData.search.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700/50">
                          <p className="text-xs font-bold uppercase text-zinc-500 mb-2 flex items-center gap-1">
                             <svg viewBox="0 0 24 24" className="w-3 h-3 mr-1" fill="currentColor"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
                             Sources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.groundingData.search.map((s, i) => (
                              <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 hover:border-brand-500 hover:text-brand-500 transition-colors truncate max-w-[200px]">
                                {s.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Grounding Maps */}
                      {msg.groundingData?.maps && msg.groundingData.maps.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700/50">
                          <p className="text-xs font-bold uppercase text-zinc-500 mb-2 flex items-center gap-1"><MapPin size={10}/> Locations</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.groundingData.maps.map((m, i) => (
                              <a key={i} href={m.uri} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded border border-green-200 dark:border-green-800 hover:border-green-500 transition-colors">
                                <MapPin size={10} className="mr-1" /> {m.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Copy Action */}
                      {msg.text && (
                        <div className="mt-2 flex justify-end md:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleCopy(msg.text!, msg.id)}
                             className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                               msg.sender === Sender.User
                               ? 'text-brand-100 hover:text-white hover:bg-brand-700'
                               : 'text-zinc-400 hover:text-brand-600 hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
                             }`}
                           >
                             {copiedMessageId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                             {copiedMessageId === msg.id ? 'Copied' : 'Copy'}
                           </button>
                        </div>
                      )}
                   </div>
                 </div>
               ))}
               
               {isLoading && (
                 <div className="flex justify-start animate-pulse">
                   <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl rounded-bl-none p-4 flex items-center space-x-2">
                     <Loader2 className="animate-spin text-brand-500" size={18} />
                     <span className="text-sm text-zinc-500">Thinking...</span>
                   </div>
                 </div>
               )}
               <div ref={scrollRef} />
             </div>
           </div>
        </div>

        {/* Input Area - Dynamic Positioning */}
        <div className={`
          ${isCentered ? 'w-full max-w-3xl px-4 mx-auto mb-24' : 'p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-10'}
          transition-all duration-500 ease-in-out
        `}>
           <div className={`${isCentered ? 'w-full' : 'max-w-4xl mx-auto'} space-y-3`}>
             
             {(mode === AppMode.ImageGen) && (
               <ImageVideoControls 
                  mode='image'
                  imgConfig={imgConfig}
                  videoConfig={{ prompt: "", aspectRatio: "16:9", resolution: "720p" }}
                  setImgConfig={setImgConfig}
                  setVideoConfig={() => {}}
               />
             )}

             <div className="relative flex items-end bg-zinc-100 dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-brand-500/50 transition-all shadow-lg group">
                
                <div className="p-3 flex items-end gap-2">
                   <label className="cursor-pointer text-zinc-400 hover:text-brand-500 transition-colors p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700" title="Upload Image">
                     <Camera size={22} />
                     <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                   </label>

                   {/* Interactive Google Search Toggle */}
                   <button
                     onClick={() => setEnableSearch(!enableSearch)}
                     className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
                       enableSearch 
                         ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800 shadow-sm' 
                         : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                     }`}
                     title={enableSearch ? "Search Enabled" : "Enable Google Search"}
                   >
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
                   </button>
                </div>

                <div className="flex-1 py-4 pr-4">
                   {attachment && (
                     <div className="mb-2 inline-flex items-center bg-white dark:bg-zinc-700 rounded-lg px-3 py-1.5 border border-zinc-200 dark:border-zinc-600 shadow-sm animate-in zoom-in-95">
                       <span className="text-xs font-medium truncate max-w-[150px]">Image Attached</span>
                       <button onClick={() => setAttachment(null)} className="ml-2 text-red-500 hover:text-red-600 p-0.5 rounded"><X size={12}/></button>
                     </div>
                   )}
                   <textarea 
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     onKeyDown={(e) => {
                       if(e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleSend();
                       }
                     }}
                     placeholder={
                        mode === AppMode.ImageGen ? "Describe the image you want to create..." : 
                        mode === AppMode.Education ? "Ask about a topic or platform..." :
                        mode === AppMode.Shopping ? "Search for products and best prices..." :
                        enableSearch ? "Ask anything (Search Enabled)..." : "Message ARISE..."
                     }
                     className="w-full bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none max-h-48 min-h-[24px] py-0 text-base leading-relaxed"
                     rows={1}
                     style={{ minHeight: '24px' }}
                   />
                </div>

                <div className="p-3">
                  <button 
                    onClick={handleSend}
                    disabled={(!input.trim() && !attachment) || isLoading}
                    className={`p-3 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center ${
                      (!input.trim() && !attachment) || isLoading 
                        ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/25'
                    }`}
                  >
                    <Send size={20} className={isLoading ? 'hidden' : 'block'} />
                    <Loader2 size={20} className={isLoading ? 'animate-spin' : 'hidden'} />
                  </button>
                </div>
             </div>
             <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 mt-2">
               ARISE can make mistakes. Consider checking important information.
             </p>
           </div>
        </div>
      </main>
    </div>
  );
}
