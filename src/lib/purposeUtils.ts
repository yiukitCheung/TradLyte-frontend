export interface UserPurpose {
  primaryGoal: string;
  purposeStatement: string;
  onboardingComplete: boolean;
}

const PURPOSE_STORAGE_KEY = 'tradlyte_purpose';
const QUOTE_STORAGE_KEY = 'tradlyte_quote_index';
const LAST_QUOTE_DATE_KEY = 'tradlyte_last_quote_date';

export const getUserPurpose = (): UserPurpose | null => {
  try {
    const stored = localStorage.getItem(PURPOSE_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as UserPurpose;
  } catch {
    return null;
  }
};

export const saveUserPurpose = (purpose: UserPurpose): void => {
  try {
    localStorage.setItem(PURPOSE_STORAGE_KEY, JSON.stringify(purpose));
  } catch (error) {
    console.error('Failed to save user purpose:', error);
  }
};

export const isOnboardingComplete = (): boolean => {
  const purpose = getUserPurpose();
  return purpose?.onboardingComplete ?? false;
};

export const checkPurposeAlignment = (stock: { symbol: string; industry?: string }, purpose: UserPurpose | null): boolean => {
  if (!purpose) return false;
  
  // Simple alignment check - can be enhanced later
  // For MVP, we'll do a basic keyword match
  const purposeLower = purpose.purposeStatement.toLowerCase();
  const goalLower = purpose.primaryGoal.toLowerCase();
  
  // Check if purpose mentions the stock's industry or related terms
  const techKeywords = ['technology', 'tech', 'innovation', 'digital'];
  const financeKeywords = ['financial', 'finance', 'money', 'wealth'];
  const healthcareKeywords = ['health', 'medical', 'wellness'];
  
  if (stock.industry) {
    const industryLower = stock.industry.toLowerCase();
    if (industryLower.includes('technology') || industryLower.includes('tech')) {
      return techKeywords.some(keyword => purposeLower.includes(keyword) || goalLower.includes(keyword));
    }
    if (industryLower.includes('financial') || industryLower.includes('finance')) {
      return financeKeywords.some(keyword => purposeLower.includes(keyword) || goalLower.includes(keyword));
    }
    if (industryLower.includes('health') || industryLower.includes('medical')) {
      return healthcareKeywords.some(keyword => purposeLower.includes(keyword) || goalLower.includes(keyword));
    }
  }
  
  // Default to neutral (not sure) if we can't determine
  return false;
};

export const getDailyQuote = (quotes: Array<{ quote: string; author: string; category: string }>): { quote: string; author: string; category: string } => {
  const today = new Date().toDateString();
  const lastDate = localStorage.getItem(LAST_QUOTE_DATE_KEY);
  
  let quoteIndex = 0;
  
  if (lastDate === today) {
    // Same day, use stored index
    const storedIndex = localStorage.getItem(QUOTE_STORAGE_KEY);
    quoteIndex = storedIndex ? parseInt(storedIndex, 10) : 0;
  } else {
    // New day, rotate to next quote
    const storedIndex = localStorage.getItem(QUOTE_STORAGE_KEY);
    quoteIndex = storedIndex ? (parseInt(storedIndex, 10) + 1) % quotes.length : 0;
    localStorage.setItem(QUOTE_STORAGE_KEY, quoteIndex.toString());
    localStorage.setItem(LAST_QUOTE_DATE_KEY, today);
  }
  
  return quotes[quoteIndex];
};
