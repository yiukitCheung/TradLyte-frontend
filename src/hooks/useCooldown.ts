import { useState, useEffect } from 'react';

const COOLDOWN_ENABLED_KEY = 'tradlyte_cooldown_enabled';
const LAST_PROFITABLE_TRADE_KEY = 'tradlyte_last_profitable_trade';
const COOLDOWN_HOURS = 24;

export const useCooldown = () => {
  const [cooldownEnabled, setCooldownEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(COOLDOWN_ENABLED_KEY);
    return stored === 'true';
  });

  const [isInCooldown, setIsInCooldown] = useState(false);
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  useEffect(() => {
    if (!cooldownEnabled) {
      setIsInCooldown(false);
      setShouldShowPrompt(false);
      return;
    }

    const lastTrade = localStorage.getItem(LAST_PROFITABLE_TRADE_KEY);
    if (!lastTrade) {
      setIsInCooldown(false);
      setShouldShowPrompt(false);
      return;
    }

    const lastTradeDate = new Date(lastTrade);
    const now = new Date();
    const hoursSince = (now.getTime() - lastTradeDate.getTime()) / (1000 * 60 * 60);

    if (hoursSince < COOLDOWN_HOURS) {
      setIsInCooldown(true);
      // Show prompt if within first hour after trade
      setShouldShowPrompt(hoursSince < 1);
    } else {
      setIsInCooldown(false);
      setShouldShowPrompt(false);
    }
  }, [cooldownEnabled]);

  const recordProfitableTrade = () => {
    localStorage.setItem(LAST_PROFITABLE_TRADE_KEY, new Date().toISOString());
    if (cooldownEnabled) {
      setIsInCooldown(true);
      setShouldShowPrompt(true);
    }
  };

  const enableCooldown = () => {
    localStorage.setItem(COOLDOWN_ENABLED_KEY, 'true');
    setCooldownEnabled(true);
  };

  const disableCooldown = () => {
    localStorage.setItem(COOLDOWN_ENABLED_KEY, 'false');
    setCooldownEnabled(false);
    setIsInCooldown(false);
    setShouldShowPrompt(false);
  };

  return {
    cooldownEnabled,
    isInCooldown,
    shouldShowPrompt,
    recordProfitableTrade,
    enableCooldown,
    disableCooldown,
  };
};
