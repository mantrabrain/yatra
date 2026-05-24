import React from "react";
import { useCanCap } from "../../hooks/useCapabilities";

/**
 * Render-gate component. Hides children when the current user lacks
 * the capability. Used as the UI mirror of REST `permission_callback`
 * checks so the operator doesn't see buttons the API would 403.
 *
 * IMPORTANT — this is UX, not security.
 *   The actual access boundary is the server's permission_callback.
 *   <Can> just hides the control so the operator doesn't click and
 *   get a confusing 403. NEVER assume <Can> hiding a button is
 *   sufficient protection — the API must always re-check.
 *
 * Usage:
 *
 *   <Can cap="yatra_refund_bookings">
 *     <Button onClick={...}>Refund</Button>
 *   </Can>
 *
 *   <Can cap="yatra_view_audit_log" fallback={<UpgradeNotice/>}>
 *     <AuditTab/>
 *   </Can>
 *
 * @since 3.5.0
 */
export interface CanProps {
  /** The Yatra capability the current user must have. */
  cap: string;
  /** Children to render when allowed. */
  children: React.ReactNode;
  /** Optional element to render when DENIED. Default: null (collapse). */
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ cap, children, fallback = null }) => {
  const allowed = useCanCap(cap);
  return <>{allowed ? children : fallback}</>;
};
