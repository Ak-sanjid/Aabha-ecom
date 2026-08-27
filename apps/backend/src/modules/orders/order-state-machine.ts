import { BadRequestException } from '@nestjs/common';

/**
 * Order lifecycle state machine.
 *
 * Placed → COD verification → Confirmed → Packed → Handed to Courier →
 * In Transit → Out for Delivery → Delivered / Returned / Cancelled.
 *
 * This module is deliberately pure (no DB, no I/O) so the transition rules can
 * be exhaustively tested — Section 7 flags this as one of the two highest-risk
 * areas for silent bugs. Admins may override any step, but every override is
 * still recorded as an event with `isOverride: true`.
 */
export type OrderStatus =
  | 'PLACED'
  | 'PENDING_VERIFICATION'
  | 'CONFIRMED'
  | 'PACKED'
  | 'HANDED_TO_COURIER'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'ON_HOLD';

export const ORDER_STATUSES: OrderStatus[] = [
  'PLACED',
  'PENDING_VERIFICATION',
  'CONFIRMED',
  'PACKED',
  'HANDED_TO_COURIER',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
  'CANCELLED',
  'ON_HOLD',
];

/** Statuses from which no further transition is possible without an override. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = ['DELIVERED', 'RETURNED', 'CANCELLED'];

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PLACED: ['PENDING_VERIFICATION', 'CONFIRMED', 'ON_HOLD', 'CANCELLED'],
  PENDING_VERIFICATION: ['CONFIRMED', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['PENDING_VERIFICATION', 'CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'ON_HOLD', 'CANCELLED'],
  PACKED: ['HANDED_TO_COURIER', 'CANCELLED'],
  HANDED_TO_COURIER: ['IN_TRANSIT', 'RETURNED', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED', 'IN_TRANSIT'],
  DELIVERED: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
};

/** Marketing/analytics event emitted when an order reaches a status. */
const EVENT_BY_STATUS: Partial<Record<OrderStatus, string>> = {
  PLACED: 'PURCHASE',
  ON_HOLD: 'ORDER_ON_HOLD',
  PENDING_VERIFICATION: 'ORDER_PROCESSING',
  CONFIRMED: 'ORDER_CONFIRMED',
  PACKED: 'ORDER_PROCESSING',
  HANDED_TO_COURIER: 'ORDER_SHIPPING',
  IN_TRANSIT: 'ORDER_SHIPPING',
  OUT_FOR_DELIVERY: 'ORDER_SHIPPING',
  DELIVERED: 'ORDER_DELIVERED',
  RETURNED: 'CANCEL_PURCHASE',
  CANCELLED: 'CANCEL_PURCHASE',
};

/** Statuses that should trigger a customer notification (SMS/WhatsApp/email). */
const NOTIFY_ON: readonly OrderStatus[] = [
  'CONFIRMED',
  'HANDED_TO_COURIER',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RETURNED',
];

export interface TransitionInput {
  from: OrderStatus;
  to: OrderStatus;
  /** Admin manual override — permitted at every step, but always audited. */
  isOverride?: boolean;
  reason?: string;
  actorId?: string | null;
  actorLabel?: string | null;
}

export interface TransitionPlan {
  from: OrderStatus;
  to: OrderStatus;
  isOverride: boolean;
  reason?: string;
  /** Timestamp columns that must be stamped on the order row. */
  timestampFields: Array<'confirmedAt' | 'deliveredAt' | 'cancelledAt' | 'returnedAt'>;
  /** Analytics event name to enqueue for Facebook CAPI + GA4. */
  marketingEvent?: string;
  /** Whether the customer should be notified at this milestone. */
  notifyCustomer: boolean;
  /** Whether reserved stock must be released back to inventory. */
  restock: boolean;
}

export function allowedTransitions(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return allowedTransitions(from).includes(to);
}

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Validates a transition and returns everything the caller must persist.
 * Throws when the transition is illegal and no override was requested.
 */
export function planTransition(input: TransitionInput): TransitionPlan {
  const { from, to } = input;
  const isOverride = input.isOverride ?? false;

  if (from === to) {
    throw new BadRequestException(`Order is already ${to}`);
  }

  if (!canTransition(from, to) && !isOverride) {
    throw new BadRequestException(
      `Cannot move an order from ${from} to ${to}. Allowed: ${allowedTransitions(from).join(', ') || 'none'}.`,
    );
  }

  if (isOverride && !input.reason) {
    throw new BadRequestException('A manual override requires a reason for the audit trail');
  }

  const timestampFields: TransitionPlan['timestampFields'] = [];
  if (to === 'CONFIRMED') timestampFields.push('confirmedAt');
  if (to === 'DELIVERED') timestampFields.push('deliveredAt');
  if (to === 'CANCELLED') timestampFields.push('cancelledAt');
  if (to === 'RETURNED') timestampFields.push('returnedAt');

  return {
    from,
    to,
    isOverride,
    reason: input.reason,
    timestampFields,
    marketingEvent: EVENT_BY_STATUS[to],
    notifyCustomer: NOTIFY_ON.includes(to),
    // Cancelling or returning frees the reserved units again.
    restock: to === 'CANCELLED' || to === 'RETURNED',
  };
}

/**
 * Cancellation is time-boxed: customers may cancel themselves only inside the
 * window, after which the request has to go through support/admin override.
 */
export function isWithinCancelWindow(
  cancelableUntil: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!cancelableUntil) return false;
  return now.getTime() <= cancelableUntil.getTime();
}

export function computeCancelWindow(placedAt: Date, windowMinutes = 120): Date {
  return new Date(placedAt.getTime() + windowMinutes * 60_000);
}
