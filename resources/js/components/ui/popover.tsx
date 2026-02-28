import * as React from "react";

export interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export const Popover: React.FC<PopoverProps> = ({
  children,
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange],
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative">{children}</div>
    </PopoverContext.Provider>
  );
};

export const PopoverTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children, asChild }) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: (node: HTMLElement) => {
        triggerRef.current = node;
        if (typeof (children as any).ref === "function") {
          (children as any).ref(node);
        }
      },
      onClick: () => setOpen(!open),
    } as any);
  }

  return (
    <div
      ref={(node) => {
        triggerRef.current = node;
      }}
      onClick={() => setOpen(!open)}
      className="cursor-pointer"
    >
      {children}
    </div>
  );
};

export const PopoverContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}> = ({ children, className = "", align = "start", side = "bottom" }) => {
  const { open, setOpen, triggerRef } = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  // Calculate position
  React.useEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null);
      return;
    }

    const calculatePosition = () => {
      if (!triggerRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Use estimated dimensions if content not yet rendered
      const estimatedWidth = 320; // w-80 = 320px
      const estimatedHeight = 300; // Estimated height

      let top = 0;
      let left = 0;

      // Calculate position based on side
      if (side === "bottom") {
        top = triggerRect.bottom + scrollY + 8;
        if (top + estimatedHeight > scrollY + viewportHeight) {
          // Flip to top if not enough space below
          top = triggerRect.top + scrollY - estimatedHeight - 8;
        }
      } else if (side === "top") {
        top = triggerRect.top + scrollY - estimatedHeight - 8;
        if (top < scrollY) {
          // Flip to bottom if not enough space above
          top = triggerRect.bottom + scrollY + 8;
        }
      } else if (side === "right") {
        top = triggerRect.top + scrollY;
        left = triggerRect.right + scrollX + 8;
        if (left + estimatedWidth > scrollX + viewportWidth) {
          // Flip to left if not enough space on right
          left = triggerRect.left + scrollX - estimatedWidth - 8;
        }
      } else if (side === "left") {
        top = triggerRect.top + scrollY;
        left = triggerRect.left + scrollX - estimatedWidth - 8;
        if (left < scrollX) {
          // Flip to right if not enough space on left
          left = triggerRect.right + scrollX + 8;
        }
      }

      // Adjust horizontal alignment
      if (side === "top" || side === "bottom") {
        if (align === "start") {
          left = triggerRect.left + scrollX;
        } else if (align === "center") {
          left =
            triggerRect.left +
            scrollX +
            triggerRect.width / 2 -
            estimatedWidth / 2;
        } else if (align === "end") {
          left = triggerRect.right + scrollX - estimatedWidth;
        }

        // Ensure popover doesn't go off-screen horizontally
        if (left < scrollX) {
          left = scrollX + 8;
        } else if (left + estimatedWidth > scrollX + viewportWidth) {
          left = scrollX + viewportWidth - estimatedWidth - 8;
        }
      }

      // Ensure popover doesn't go off-screen vertically
      if (top < scrollY) {
        top = scrollY + 8;
      } else if (top + estimatedHeight > scrollY + viewportHeight) {
        top = scrollY + viewportHeight - estimatedHeight - 8;
      }

      setPosition({ top, left });

      // Refine position after content is rendered
      requestAnimationFrame(() => {
        if (!contentRef.current || !triggerRef.current) return;

        const contentRect = contentRef.current.getBoundingClientRect();
        const currentTop = top;
        const currentLeft = left;

        let refinedTop = currentTop;
        let refinedLeft = currentLeft;

        // Refine vertical position
        if (refinedTop + contentRect.height > scrollY + viewportHeight) {
          refinedTop = scrollY + viewportHeight - contentRect.height - 8;
        }
        if (refinedTop < scrollY) {
          refinedTop = scrollY + 8;
        }

        // Refine horizontal position
        if (refinedLeft + contentRect.width > scrollX + viewportWidth) {
          refinedLeft = scrollX + viewportWidth - contentRect.width - 8;
        }
        if (refinedLeft < scrollX) {
          refinedLeft = scrollX + 8;
        }

        // Only update if position changed
        if (refinedTop !== currentTop || refinedLeft !== currentLeft) {
          setPosition({ top: refinedTop, left: refinedLeft });
        }
      });
    };

    // Calculate position immediately
    calculatePosition();

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, align, side]);

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        // Check if click is on trigger
        if (
          triggerRef.current &&
          triggerRef.current.contains(event.target as Node)
        ) {
          return;
        }
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  // Show with initial position, refine after render
  const initialPosition = position || { top: 0, left: 0 };

  return (
    <div
      ref={contentRef}
      className={`fixed z-[9999] w-72 rounded-md border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800 ${className}`}
      style={{
        top: `${initialPosition.top}px`,
        left: `${initialPosition.left}px`,
        visibility: position ? "visible" : "hidden",
      }}
    >
      {children}
    </div>
  );
};
