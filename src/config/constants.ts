export const PLATFORM_NAME = "Eurohive";
export const PLATFORM_URL = "https://eurohive.eu";
export const PLATFORM_FEE_PERCENT = 10;

export const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Branding & Identity",
  "Data Science & ML",
  "DevOps & Cloud",
  "SEO & Marketing",
  "Copywriting & Content",
  "Video & Animation",
  "Consulting & Strategy",
  "Cybersecurity",
  "Blockchain & Web3",
] as const;

export const SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "AWS", "Figma", "UI/UX",
  "Branding", "SEO", "TensorFlow", "SQL", "Docker", "Kubernetes", "Go",
  "Tailwind CSS", "Webflow", "WordPress", "GraphQL", "Vue.js", "Angular",
  "Rust", "Swift", "Flutter", "Firebase", "PostgreSQL", "MongoDB",
  "Illustration", "Copywriting", "Content Strategy", "Analytics",
] as const;

export const EU_COUNTRIES = [
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czechia", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
] as const;

export function getCountryByCode(code: string) {
  return EU_COUNTRIES.find((c) => c.code === code);
}

export type Category = (typeof CATEGORIES)[number];
export type Skill = (typeof SKILLS)[number];
