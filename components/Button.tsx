import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "relative px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95";
  
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 border border-emerald-500/50",
    secondary: "bg-slate-800 text-white hover:bg-slate-700 shadow-md shadow-slate-800/20",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20",
    outline: "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Vänta...</span>
        </div>
      ) : children}
    </button>
  );
};
