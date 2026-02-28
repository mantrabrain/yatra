/**
 * Conditional Render Component
 * Renders children based on permissions and Pro version status
 * Supports extensibility for Pro version modifications
 */

import React from "react";
import { usePermissions } from "../../hooks/usePermissions";

interface ConditionalRenderProps {
  children: React.ReactNode;
  capability?: string;
  role?: string;
  requirePro?: boolean;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Conditionally renders content based on permissions, roles, or Pro status
 *
 * @example
 * <ConditionalRender capability="yatra_edit_trips">
 *   <EditButton />
 * </ConditionalRender>
 *
 * @example
 * <ConditionalRender requirePro fallback={<UpgradeMessage />}>
 *   <ProFeature />
 * </ConditionalRender>
 */
export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  capability,
  role,
  requirePro = false,
  fallback = null,
  className = "",
}) => {
  const { can, hasRole, isPro } = usePermissions();

  // Check if should render
  let shouldRender = true;

  if (capability && !can(capability)) {
    shouldRender = false;
  }

  if (role && !hasRole(role)) {
    shouldRender = false;
  }

  if (requirePro && !isPro) {
    shouldRender = false;
  }

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <div className={className}>{children}</div>;
};

export default ConditionalRender;
