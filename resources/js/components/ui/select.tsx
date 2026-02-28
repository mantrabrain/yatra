import * as React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

// SVG arrows for light and dark modes
const dropdownArrowLight = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
const dropdownArrowDark = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23d1d5db' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, style, ...props }, ref) => {
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
      // Check if dark mode is active
      const checkDarkMode = () => {
        setIsDark(document.documentElement.classList.contains("dark"));
      };

      // Initial check
      checkDarkMode();

      // Watch for changes
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      return () => observer.disconnect();
    }, []);

    return (
      <select
        className={`flex h-11 w-full rounded-md border-2 border-gray-300 bg-white px-4 text-base text-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-offset-gray-900 dark:focus-visible:ring-blue-400 transition-colors cursor-pointer ${className}`}
        ref={ref}
        style={{
          paddingRight: "2.5rem",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
          backgroundImage: isDark ? dropdownArrowDark : dropdownArrowLight,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.75rem center",
          backgroundSize: "16px 16px",
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";

export { Select };
