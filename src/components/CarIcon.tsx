import React from 'react';

interface CarIconProps {
  className?: string;
  variant?: 'front' | 'side';
  strokeColor?: string;
}

export const CarIcon: React.FC<CarIconProps> = ({
  className = 'w-20 h-20 text-[#1D68F2]',
  variant = 'front',
  strokeColor = 'currentColor',
}) => {
  if (variant === 'side') {
    // Side profile car matching Image 2
    return (
      <svg
        viewBox="0 0 120 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        stroke={strokeColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Car body contour */}
        <path d="M12 48 L22 48 C24 40 32 34 41 34 C50 34 58 40 60 48 L80 48 C82 40 90 34 99 34 C108 34 116 40 118 48 L114 36 C112 32 108 30 102 30 L90 30 L72 16 C69 13 65 12 60 12 L38 12 C32 12 26 16 23 22 L14 36 C10 40 8 44 12 48 Z" />
        
        {/* Windows */}
        <path d="M40 18 L58 18 L58 30 L32 30 L40 18 Z" />
        <path d="M64 18 L73 18 L83 30 L64 30 L64 18 Z" />
        
        {/* Front Wheel */}
        <circle cx="41" cy="48" r="8" fill="white" stroke={strokeColor} strokeWidth="4" />
        <circle cx="41" cy="48" r="2.5" fill={strokeColor} />
        
        {/* Rear Wheel */}
        <circle cx="99" cy="48" r="8" fill="white" stroke={strokeColor} strokeWidth="4" />
        <circle cx="99" cy="48" r="2.5" fill={strokeColor} />
      </svg>
    );
  }

  // Front outline matching Image 1 exactly
  return (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke={strokeColor}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Roof and windshield */}
      <path d="M28 26 C33 16 38 13 50 13 C62 13 67 16 72 26" />
      
      {/* Side mirrors */}
      <path d="M19 28 C15 28 14 30 15 33 C16 35 20 35 22 34" />
      <path d="M81 28 C85 28 86 30 85 33 C84 35 80 35 78 34" />

      {/* Main Body */}
      <path d="M22 34 C19 36 17 41 17 46 C17 56 19 60 23 62 L27 62 C29 62 30 60 30 58 L30 54 L70 54 L70 58 C70 60 71 62 73 62 L77 62 C81 60 83 56 83 46 C83 41 81 36 78 34 L72 26 L28 26 Z" />
      
      {/* Left Headlight */}
      <path d="M26 42 C29 42 35 44 34 49 C30 50 25 47 26 42 Z" strokeWidth="3" />
      
      {/* Right Headlight */}
      <path d="M74 42 C71 42 65 44 66 49 C70 50 75 47 74 42 Z" strokeWidth="3" />
      
      {/* Front Grille / License Plate Area */}
      <rect x="38" y="47" width="24" height="7" rx="3" strokeWidth="3" />

      {/* Bottom Wheels */}
      <rect x="21" y="62" width="10" height="7" rx="2" fill={strokeColor} stroke="none" />
      <rect x="69" y="62" width="10" height="7" rx="2" fill={strokeColor} stroke="none" />
    </svg>
  );
};
