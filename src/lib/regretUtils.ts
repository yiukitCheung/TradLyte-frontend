export interface Regret {
  stockSymbol: string;
  date: string;
  reason: string;
  notes?: string;
  industry?: string;
}

const REGRET_STORAGE_KEY = 'tradlyte_regrets';

export const getRegrets = (): Regret[] => {
  try {
    const stored = localStorage.getItem(REGRET_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as Regret[];
  } catch {
    return [];
  }
};

export const addRegret = (regret: Regret): void => {
  try {
    const regrets = getRegrets();
    regrets.push(regret);
    localStorage.setItem(REGRET_STORAGE_KEY, JSON.stringify(regrets));
  } catch (error) {
    console.error('Failed to add regret:', error);
  }
};

export const checkSimilarRegrets = (stockSymbol: string, industry?: string): Regret | null => {
  const regrets = getRegrets();
  
  // Check for exact symbol match first
  const exactMatch = regrets.find(r => r.stockSymbol.toUpperCase() === stockSymbol.toUpperCase());
  if (exactMatch) return exactMatch;
  
  // Check for industry match if industry is provided
  if (industry) {
    const industryMatch = regrets.find(r => 
      r.industry && r.industry.toLowerCase() === industry.toLowerCase()
    );
    if (industryMatch) return industryMatch;
  }
  
  return null;
};

export const removeRegret = (stockSymbol: string, date: string): void => {
  try {
    const regrets = getRegrets();
    const filtered = regrets.filter(r => 
      !(r.stockSymbol === stockSymbol && r.date === date)
    );
    localStorage.setItem(REGRET_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove regret:', error);
  }
};
