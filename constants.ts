
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

// Model definitions
export const MODEL_FLASH_LITE = 'gemini-flash-lite-latest'; // Fast responses
export const MODEL_FLASH = 'gemini-2.5-flash'; // General purpose, Tools
export const MODEL_PRO_THINKING = 'gemini-3-pro-preview'; // Complex tasks
export const MODEL_FLASH_IMAGE = 'gemini-2.5-flash-image'; // Image editing/fast gen
export const MODEL_PRO_IMAGE = 'gemini-3-pro-image-preview'; // High quality image gen

export const SYSTEM_INSTRUCTIONS = {
  [MODEL_FLASH_LITE]: "You are ARISE, a very polite and helpful assistant. Please address the user warmly.",
  EDUCATION: `You are ARISE's Teacher Mode. You provide clear explanations, step-by-step guidance, and a very polite, encouraging teaching style. You are knowledgeable about Bangladesh's top EdTech platforms like 10 Minute School, Shikho, and others. Always be encouraging.`,
  SHOPPING: `You are ARISE's Shopping Assistant. Your primary goal is to help the user find the best price rates and deals. Compare prices diligently. You know about top Bangladeshi brands (Aarong, Yellow, etc.) and International brands. Be very polite and professional.`,
  DEFAULT: "You are ARISE, a world-class AI assistant. You are exceptionally polite, friendly, and intelligent."
};
