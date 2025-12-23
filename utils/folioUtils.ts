import { NumberingType } from '../types';

export const toRoman = (num: number): string => {
  if (num < 1) return "";
  const lookup: Record<string, number> = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
  let roman = '';
  for (const i in lookup ) {
    while ( num >= lookup[i] ) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
};

export const toAlpha = (num: number): string => {
  // 1 -> A, 26 -> Z, 27 -> AA
  let s = '';
  let t = num;
  while (t > 0) {
    t--;
    s = String.fromCharCode(65 + (t % 26)) + s;
    t = Math.floor(t / 26);
  }
  return s;
};

export const formatFolio = (
  index: number, // 0-based index of the valid pages
  totalCount: number,
  settings: {
    startNumber: number;
    direction: string;
    type: string;
    format: string;
  }
): string => {
  let value = 0;
  
  if (settings.direction === 'asc') {
    value = settings.startNumber + index;
  } else {
    value = settings.startNumber + (totalCount - 1 - index);
  }

  let stringValue = value.toString();

  if (settings.type === NumberingType.Roman) {
    stringValue = toRoman(value);
  } else if (settings.type === NumberingType.Alpha) {
    stringValue = toAlpha(value);
  } else {
    // Numeric padding handling if user puts 00{n} manually or logic check
    // Simple padding logic: if format has 00{n}, we might want 001, but for now simple replacement
    stringValue = value.toString();
  }

  return settings.format.replace('{n}', stringValue);
};
