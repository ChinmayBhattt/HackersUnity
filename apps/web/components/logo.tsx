'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({
  className = '',
  size = 72,
  showText = false,
}: LogoProps) {
  const [lightError, setLightError] = useState(false);
  const [darkError, setDarkError] = useState(false);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Light Mode Logo (Visible in Light theme) */}
        <Image
          src={lightError ? 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189208/hackers-unity/branding/logo.png' : 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189205/hackers-unity/branding/logo-black.png'}
          alt="Hacker's Unity Logo"
          width={size}
          height={size}
          unoptimized
          className="dark:hidden object-contain w-auto h-14 sm:h-16 lg:h-[68px] transition-transform duration-200 group-hover:scale-105"
          priority
          onError={() => setLightError(true)}
        />

        {/* Dark Mode Logo (Visible in Dark theme - white logo) */}
        <Image
          src={darkError ? 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189609/hackers-unity/branding/logo-transparent.png' : 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189609/hackers-unity/branding/logo-main.png'}
          alt="Hacker's Unity Logo"
          width={size}
          height={size}
          unoptimized
          className="hidden dark:block object-contain w-auto h-14 sm:h-16 lg:h-[68px] transition-transform duration-200 group-hover:scale-105"
          priority
          onError={() => setDarkError(true)}
        />
      </div>

      {showText && (
        <div className="flex items-center font-black italic tracking-tight select-none text-xl sm:text-2xl leading-none whitespace-nowrap ml-2">
          <span className="text-[#0099e6] font-extrabold pr-1">
            Hacker&apos;s
          </span>
          <span className="text-[#ff7800] font-extrabold">
            Unity
          </span>
        </div>
      )}
    </div>
  );
}

