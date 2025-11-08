/**
 * Help Text Component
 * Displays helpful information for users
 */

import React from 'react';
import { Info, HelpCircle } from 'lucide-react';

interface HelpTextProps {
  text: string;
  variant?: 'info' | 'help';
  className?: string;
}

export const HelpText: React.FC<HelpTextProps> = ({ 
  text, 
  variant = 'info',
  className = '' 
}) => {
  const Icon = variant === 'help' ? HelpCircle : Info;
  
  return (
    <div className={`flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
      <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
};

