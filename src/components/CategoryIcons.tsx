import React from 'react';

export interface CategoryStyleInfo {
  iconName: 'wrench' | 'zap' | 'car' | 'gear' | 'tire' | 'snowflake' | 'bottle' | 'fuel' | 'plus';
  name: string;
  color: string;
  bg: string;
  border: string;
  textColor: string;
}

export function getCategoryStyle(category?: string): CategoryStyleInfo {
  const c = (category || '').toLowerCase().trim();

  if (c === 'gorivo' || c === 'fuel') {
    return {
      iconName: 'fuel',
      name: 'Gorivo',
      color: '#D97706',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      textColor: 'text-amber-600',
    };
  }
  if (c === 'mehanika' || c === 'wrench') {
    return {
      iconName: 'wrench',
      name: 'Mehanika',
      color: '#1D68F2',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      textColor: 'text-[#1D68F2]',
    };
  }
  if (c === 'elektrika' || c === 'zap') {
    return {
      iconName: 'zap',
      name: 'Elektrika',
      color: '#EA580C',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      textColor: 'text-amber-600',
    };
  }
  if (c === 'limarija' || c === 'car') {
    return {
      iconName: 'car',
      name: 'Limarija',
      color: '#EF4444',
      bg: 'bg-red-50',
      border: 'border-red-100',
      textColor: 'text-red-500',
    };
  }
  if (c === 'oprema' || c === 'gear') {
    return {
      iconName: 'gear',
      name: 'Oprema',
      color: '#9333EA',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      textColor: 'text-purple-600',
    };
  }
  if (c === 'gume_felge' || c === 'gume' || c === 'tire' || c.includes('gume')) {
    return {
      iconName: 'tire',
      name: 'Gume i felge',
      color: '#1E293B',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      textColor: 'text-slate-700',
    };
  }
  if (c === 'klima' || c === 'snowflake') {
    return {
      iconName: 'snowflake',
      name: 'Klima uređaj',
      color: '#0284C7',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      textColor: 'text-sky-600',
    };
  }
  if (c === 'tekucine' || c === 'tekućine' || c === 'bottle' || c === 'ulja') {
    return {
      iconName: 'bottle',
      name: 'Tekućine',
      color: '#2563EB',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      textColor: 'text-blue-600',
    };
  }
  return {
    iconName: 'plus',
    name: 'Ostalo',
    color: '#475569',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    textColor: 'text-slate-600',
  };
}

interface CategoryIconProps {
  type: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  type,
  className = 'w-7 h-7',
  color,
}) => {
  const style = getCategoryStyle(type);
  const activeColor = color || style.color;

  switch (style.iconName) {
    case 'wrench':
      // Mechanical wrench
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M25 7a6 6 0 0 0-8.2 8.2L5.5 26.5a2 2 0 0 0 2.8 2.8L19.6 18.6A6 6 0 0 0 25 7Z" />
          <circle cx="8" cy="24" r="1" fill={activeColor} />
        </svg>
      );

    case 'zap':
      // Orange electrical lightning
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M17 3L7 17h8l-2 12 12-14h-8l2-12z" />
        </svg>
      );

    case 'car':
      // Red car body
      return (
        <svg
          viewBox="0 0 36 24"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M4 16 L7 16 C8 13 11 11 14 11 C17 11 20 13 21 16 L27 16 C28 13 31 11 34 11 L34 16" />
          <path d="M3 16 L3 12 C3 10 5 8 8 8 L12 8 L17 4 C18 3 20 3 22 3 L27 3 C29 3 31 5 32 8 L33 12 C35 13 36 14 36 16 L36 18 L1 18 L1 16 Z" />
          <circle cx="14" cy="16" r="2.5" fill="white" stroke={activeColor} />
          <circle cx="30" cy="16" r="2.5" fill="white" stroke={activeColor} />
        </svg>
      );

    case 'gear':
      // Purple gear / settings flower
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M16 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
          <path d="M24.8 19.3a10 10 0 0 0 .2-6.6l-2.4-.4a7.8 7.8 0 0 0-1.7-2.9l1.4-2a10 10 0 0 0-4.7-4.7l-2 1.4a7.8 7.8 0 0 0-2.9-1.7l-.4-2.4a10 10 0 0 0-6.6.2l.4 2.4a7.8 7.8 0 0 0-2.9 1.7l-2-1.4a10 10 0 0 0-4.7 4.7l1.4 2a7.8 7.8 0 0 0-1.7 2.9l-2.4.4a10 10 0 0 0-.2 6.6l2.4.4a7.8 7.8 0 0 0 1.7 2.9l-1.4 2a10 10 0 0 0 4.7 4.7l2-1.4a7.8 7.8 0 0 0 2.9 1.7l.4 2.4a10 10 0 0 0 6.6-.2l-.4-2.4a7.8 7.8 0 0 0 2.9-1.7l2 1.4a10 10 0 0 0 4.7-4.7l-1.4-2a7.8 7.8 0 0 0 1.7-2.9l2.4-.4Z" />
        </svg>
      );

    case 'tire':
      // Dark concentric circle / wheel
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="16" cy="16" r="13" />
          <circle cx="16" cy="16" r="8" />
          <circle cx="16" cy="16" r="3" fill={activeColor} />
        </svg>
      );

    case 'snowflake':
      // Blue snowflake
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <line x1="16" y1="2" x2="16" y2="30" />
          <line x1="2" y1="16" x2="30" y2="16" />
          <line x1="6" y1="6" x2="26" y2="26" />
          <line x1="6" y1="26" x2="26" y2="6" />
          <path d="M12 4 L16 8 L20 4" />
          <path d="M12 28 L16 24 L20 28" />
          <path d="M4 12 L8 16 L4 20" />
          <path d="M28 12 L24 16 L28 20" />
        </svg>
      );

    case 'bottle':
      // Oil canister bottle
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M12 4 L20 4 L20 8 L26 12 L26 27 C26 28.5 24.5 30 23 30 L9 30 C7.5 30 6 28.5 6 27 L6 10 C6 9 7 8 8 8 L12 8 Z" />
          <path d="M12 4 L12 8" />
          <circle cx="16" cy="20" r="3" />
        </svg>
      );

    case 'fuel':
      // Fuel pump icon
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" />
          <path d="M15 9h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L20.5 6.5" />
          <path d="M3 22h12" />
          <path d="M6 12h6" />
          <path d="M6 7h6" />
        </svg>
      );

    case 'plus':
    default:
      // Flower / plus / star shape
      return (
        <svg
          viewBox="0 0 32 32"
          fill="none"
          stroke={activeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M16 4v24M4 16h24M7.5 7.5l17 17M7.5 24.5l17-17" />
          <circle cx="16" cy="16" r="4" fill="white" stroke={activeColor} strokeWidth="2.5" />
        </svg>
      );
  }
};
