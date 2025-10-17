import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ size = 'md', showLabel = false, className = '' }) => {
  const { theme, toggleTheme, isLoading } = useTheme();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5'
  };

  if (isLoading) {
    return (
      <div className={`${buttonSizeClasses[size]} rounded-lg bg-gray-200 animate-pulse ${className}`}>
        <div className={`${sizeClasses[size]} bg-gray-300 rounded`}></div>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${buttonSizeClasses[size]}
        inline-flex items-center justify-center
        rounded-lg
        bg-card text-card-foreground
        border border-border
        hover:bg-accent hover:text-accent-foreground
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        transition-all duration-200
        group
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative">
        {theme === 'light' ? (
          <MoonIcon 
            className={`
              ${sizeClasses[size]} 
              transform transition-all duration-300 ease-in-out
              group-hover:scale-110 group-hover:rotate-12
              text-muted-foreground group-hover:text-foreground
            `} 
          />
        ) : (
          <SunIcon 
            className={`
              ${sizeClasses[size]} 
              transform transition-all duration-300 ease-in-out
              group-hover:scale-110 group-hover:rotate-12
              text-muted-foreground group-hover:text-foreground
            `} 
          />
        )}
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {theme === 'light' ? 'Dark' : 'Light'} Mode
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;