
export const EDUCATION_DATA = [
  { name: "10 Minute School", website: "https://10minuteschool.com", youtube: "https://youtube.com/c/10MinuteSchoolOfficial" },
  { name: "Shikho", website: "https://shikho.com", youtube: "https://youtube.com/c/Shikho" },
  { name: "Bohubrihi", website: "https://bohubrihi.com", youtube: "https://youtube.com/c/Bohubrihi" },
  { name: "Upskill", website: "https://upskill.com.bd", youtube: "https://youtube.com/@upskillbd" },
  { name: "E-Shikhon", website: "https://eshikhon.com", youtube: "https://youtube.com/c/EShikhon" },
  { name: "StudyPress", website: "https://studypress.org", youtube: "https://youtube.com/c/StudyPress" },
  { name: "Shikhbe Shobai", website: "https://shikhbeshobai.com", youtube: "https://youtube.com/c/ShikhbeShobai" },
  { name: "Ostad", website: "https://ostad.app", youtube: "https://youtube.com/c/OstadApp" },
  { name: "English Olympiad", website: "https://englisholympiad.net", youtube: "https://youtube.com/@englisholympiad" },
  { name: "Robi-10 Minute School Junior", website: "https://10minuteschool.com/junior", youtube: "https://youtube.com/c/10MinuteSchoolOfficial" },
  { name: "Thrive EdTech", website: "https://thrivedu.com.bd", youtube: "https://youtube.com/@thrivedu" },
  { name: "Learn With Fun BD", website: "https://learnwithfunbd.com", youtube: "https://youtube.com/@learnwithfunbd" },
  { name: "BD Class", website: "https://bdclass.com", youtube: "https://youtube.com/@bdclass" },
  { name: "Career Path", website: "https://careerpath.com.bd", youtube: "https://youtube.com/@careerpathbd" },
  { name: "Tutor Sheba", website: "https://tutorsheba.com", youtube: "https://youtube.com/@tutorshebabd" }
];

export const SHOPPING_DATA = {
  local: [
    { name: "Aarong", website: "https://aarong.com" },
    { name: "Cats Eye", website: "https://catseye.com.bd" },
    { name: "Sailor", website: "https://sailor.clothing" },
    { name: "Yellow", website: "https://yellowclothing.net" },
    { name: "Ecstasy", website: "https://ecstasybd.com" },
    { name: "Noir", website: "https://noirclothing.com.bd" },
    { name: "Dorjibari", website: "https://dorjibari.com" },
    { name: "Richman", website: "https://lubnanbd.com" },
    { name: "La Mode", website: "https://lamode.com.bd" },
    { name: "Freeland", website: "https://freeland.com.bd" },
    { name: "Daraz", website: "https://daraz.com.bd" },
    { name: "Amazon", website: "https://amazon.com" }
  ],
  intl: [
    { name: "Apple", website: "https://apple.com" },
    { name: "Nike", website: "https://nike.com" },
    { name: "Samsung", website: "https://samsung.com" },
    { name: "Gucci", website: "https://gucci.com" },
    { name: "Tesla", website: "https://tesla.com" },
    { name: "Adidas", website: "https://adidas.com" },
    { name: "Louis Vuitton", website: "https://louisvuitton.com" },
    { name: "Sony", website: "https://sony.com" },
    { name: "Rolex", website: "https://rolex.com" },
    { name: "BMW", website: "https://bmw.com" }
  ]
};

export const UI_TRANSLATIONS = {
  en: {
    home: "Home / Chat",
    education: "Education Mode",
    shopping: "Shopping Agent",
    search_placeholder: "Ask anything...",
    shopping_placeholder: "Find products, deals, or upload an image...",
    education_placeholder: "Ask about a topic or platform...",
    trending: "Trending Searches",
    local_brands: "Top Bangladesh Brands",
    intl_brands: "International Brands",
    no_results: "No products found. Try a different search.",
    buy_now: "Buy Now",
    compare: "Compare",
    wishlist: "Wishlist",
    results_for: "Results for",
    searching: "Searching...",
    scanner_tooltip: "Product Scanner",
    voice_tooltip: "Voice Search",
    trust_score: "Trust Score",
    global_price: "Global Price",
    scam_warning: "Potential Risk",
    pros: "Pros",
    cons: "Cons",
    nearby_stores: "Nearby Stores",
    verified_links: "Verified Links",
  },
  bn: {
    home: "হোম / চ্যাট",
    education: "শিক্ষা মোড",
    shopping: "শপিং অ্যাসিস্ট্যান্ট",
    search_placeholder: "যেকোনো কিছু জিজ্ঞাসা করুন...",
    shopping_placeholder: "পণ্য খুঁজুন বা ছবি আপলোড করুন...",
    education_placeholder: "কোনো বিষয় বা প্ল্যাটফর্ম সম্পর্কে জানুন...",
    trending: "জনপ্রিয় অনুসন্ধান",
    local_brands: "বাংলাদেশের শীর্ষ ব্র্যান্ড",
    intl_brands: "আন্তর্জাতিক ব্র্যান্ড",
    no_results: "কোনো পণ্য পাওয়া যায়নি। অন্য কিছু খুঁজুন।",
    buy_now: "এখনই কিনুন",
    compare: "তুলনা করুন",
    wishlist: "উইশলিস্ট",
    results_for: "ফলাফল",
    searching: "অনুসন্ধান করা হচ্ছে...",
    scanner_tooltip: "পণ্য স্ক্যানার",
    voice_tooltip: "ভয়েস সার্চ",
    trust_score: "ট্রাস্ট স্কোর",
    global_price: "গ্লোবাল প্রাইস",
    scam_warning: "ঝুঁকিপূর্ণ",
    pros: "সুবিধা",
    cons: "অসুবিধা",
    nearby_stores: "কাছাকাছি দোকান",
    verified_links: "যাচাইকৃত লিঙ্ক",
  }
};

// Model definitions
export const MODEL_FLASH_LITE = 'gemini-flash-lite-latest'; // Fast responses
export const MODEL_FLASH = 'gemini-2.5-flash'; // General purpose, Tools

export const SHOPPING_PROMPT_CORE = `
You are ARISE AI, a global smart shopping assistant connected to Google Search and real-time location services. 
Your goal is to find, compare, recommend, analyze, and display any product with accurate data, images, prices, sellers, availability, alternatives, and local store results.

Core Abilities:
1. Instant Google Shopping Search: Search product, fetch real-time info.
2. Real-time Location Detection: Nearby Store Finder with Stock Info.
3. Full Product Details: images, specs, pros/cons.
4. Price Comparison (local + global): Compare prices from top sellers.
5. AI Fraud & Scam Shield: Detect fake sellers, Trust Score (0-100).
6. Smart Budget Planner: Recommend best value.
7. Visual Search: Identify products from images.

Response Format:
Return a STRICT JSON array of products.
Include: trustScore, verifiedLinks, pros, cons, nearbyStores, globalPrice, scamWarning.
IMPORTANT: You MUST extract and use REAL image URLs from the Google Search results. Do not hallucinate invalid links.
`;

export const SYSTEM_INSTRUCTIONS = {
  [MODEL_FLASH_LITE]: "You are ARISE, a very polite and helpful assistant created by Rocanul Hassan. NEVER use the word 'Namaskar' or 'নমস্কার'. Use 'Hello', 'As-salamu alaykum', or neutral greetings.",
  EDUCATION: `You are ARISE's Teacher Mode. You provide clear explanations, step-by-step guidance, and a very polite, encouraging teaching style. You are knowledgeable about Bangladesh's top EdTech platforms like 10 Minute School, Shikho, and others. Always be encouraging. NEVER use 'Namaskar'.`,
  DEFAULT: "You are ARISE, a world-class AI assistant created by Rocanul Hassan. NEVER use the word 'Namaskar' or 'নমস্কার'. You are exceptionally polite, friendly, and intelligent."
};