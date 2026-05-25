import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  /**
   * Radix-style slot pattern — when true, Button renders no <button> element
   * of its own and instead spreads its className + props onto its single
   * child (typically an <a>). Lets pages compose `<Button asChild><a href="...">`
   * for upgrade / external links while keeping the Button look and a11y.
   *
   * Implementation note: we don't pull in @radix-ui/react-slot. The Pro
   * pages that use this pattern always pass a single React element child;
   * cloning it with the merged className + the rest of the props is what
   * Slot does internally. Keeping this dependency-free saves ~8 KB gzipped
   * and avoids a third React tree-traversal pass on every render.
   */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      asChild = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variantClasses = {
      default:
        "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
      outline:
        "border border-gray-300 bg-transparent hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800",
      ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
    };

    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    const mergedClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    if (asChild && React.isValidElement(children)) {
      // Clone the single child element and merge our styling + props onto
      // it. The child keeps its semantics (href, onClick, etc.) and gains
      // the Button look. Ref forwarding is best-effort — pages that need a
      // ref on the child should use a real ref directly on the <a>.
      const child = children as React.ReactElement<{ className?: string }>;
      const childClassName = (child.props as { className?: string }).className;
      return React.cloneElement(child, {
        ...(props as object),
        className: `${mergedClassName}${childClassName ? ` ${childClassName}` : ""}`,
      } as React.HTMLAttributes<HTMLElement>);
    }

    return (
      <button className={mergedClassName} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
