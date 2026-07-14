import { useState, useEffect } from 'react';

export interface DetectedCountry {
  code: string;
  name: string;
  flag: string;
  loading: boolean;
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🏳️';
  }
}

export function useIPGeolocation(): DetectedCountry {
  const [detected, setDetected] = useState<DetectedCountry>(() => {
    // Initial sync read from localStorage if present to avoid layout flash
    const cachedCode = localStorage.getItem('rovix_home_country');
    if (cachedCode) {
      const commonNames: Record<string, string> = {
        US: 'United States',
        IN: 'India',
        GB: 'United Kingdom',
        CA: 'Canada',
        AU: 'Australia',
        DE: 'Germany',
        FR: 'France',
        JP: 'Japan',
        KR: 'South Korea',
        BR: 'Brazil',
        ES: 'Spain',
        IT: 'Italy',
      };
      return {
        code: cachedCode,
        name: commonNames[cachedCode] || cachedCode,
        flag: getFlagEmoji(cachedCode),
        loading: false,
      };
    }
    return {
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
      loading: true,
    };
  });

  useEffect(() => {
    let active = true;

    const detect = async () => {
      // If we already have a cached value, we can still perform a background check
      // but let's run it anyway to ensure accuracy
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (!res.ok) throw new Error('Failed to fetch from ipapi');
        const data = await res.json();
        
        if (!active) return;

        if (data && data.country_code) {
          const code = data.country_code.toUpperCase();
          const name = data.country_name || code;
          const flag = getFlagEmoji(code);
          setDetected({
            code,
            name,
            flag,
            loading: false,
          });
          return;
        }
      } catch (err) {
        console.warn('Primary IP Geolocation API failed, trying fallback provider...', err);
        
        try {
          const res2 = await fetch('https://ip-api.com/json/');
          if (res2.ok && active) {
            const data2 = await res2.json();
            if (data2 && data2.countryCode) {
              const code = data2.countryCode.toUpperCase();
              const name = data2.country || code;
              const flag = getFlagEmoji(code);
              setDetected({
                code,
                name,
                flag,
                loading: false,
              });
              return;
            }
          }
        } catch (err2) {
          console.warn('Secondary IP Geolocation API failed', err2);
        }
      }

      if (!active) return;

      // Fallback: Browser timezone & language settings
      let guessedCode = 'US';
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone) {
          if (timezone.includes('Calcutta') || timezone.includes('Asia/Kolkata') || timezone.includes('Delhi') || timezone.includes('Mumbai')) {
            guessedCode = 'IN';
          } else if (timezone.includes('London') || timezone.includes('Europe/London')) {
            guessedCode = 'GB';
          } else if (timezone.includes('Sydney') || timezone.includes('Melbourne') || timezone.includes('Australia')) {
            guessedCode = 'AU';
          } else if (timezone.includes('Toronto') || timezone.includes('Vancouver') || timezone.includes('Canada')) {
            guessedCode = 'CA';
          } else if (timezone.includes('Berlin') || timezone.includes('Europe/Berlin') || timezone.includes('Germany')) {
            guessedCode = 'DE';
          } else if (timezone.includes('Paris') || timezone.includes('Europe/Paris') || timezone.includes('France')) {
            guessedCode = 'FR';
          } else if (timezone.includes('Tokyo') || timezone.includes('Asia/Tokyo') || timezone.includes('Japan')) {
            guessedCode = 'JP';
          } else if (timezone.includes('Seoul') || timezone.includes('Asia/Seoul') || timezone.includes('Korea')) {
            guessedCode = 'KR';
          } else if (timezone.includes('Sao_Paulo') || timezone.includes('Brazil')) {
            guessedCode = 'BR';
          } else {
            const lang = navigator.language || (navigator.languages && navigator.languages[0]);
            if (lang && lang.includes('-')) {
              const parts = lang.split('-');
              const possibleCode = parts[parts.length - 1].toUpperCase();
              if (possibleCode.length === 2) {
                guessedCode = possibleCode;
              }
            }
          }
        }
      } catch (timezoneErr) {
        console.warn('Timezone detection failed, using navigator locale', timezoneErr);
        const lang = navigator.language || (navigator.languages && navigator.languages[0]);
        if (lang && lang.includes('-')) {
          const parts = lang.split('-');
          const possibleCode = parts[parts.length - 1].toUpperCase();
          if (possibleCode.length === 2) {
            guessedCode = possibleCode;
          }
        }
      }

      const commonNames: Record<string, string> = {
        US: 'United States',
        IN: 'India',
        GB: 'United Kingdom',
        CA: 'Canada',
        AU: 'Australia',
        DE: 'Germany',
        FR: 'France',
        JP: 'Japan',
        KR: 'South Korea',
        BR: 'Brazil',
        ES: 'Spain',
        IT: 'Italy',
      };

      setDetected({
        code: guessedCode,
        name: commonNames[guessedCode] || guessedCode,
        flag: getFlagEmoji(guessedCode),
        loading: false,
      });
    };

    // If we didn't have cached data, trigger detection
    detect();

    return () => {
      active = false;
    };
  }, []);

  return detected;
}
