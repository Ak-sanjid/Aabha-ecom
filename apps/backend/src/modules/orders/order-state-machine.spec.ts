import { BadRequestException } from '@nestjs/common';
import {
  ORDER_STATUSES,
  allowedTransitions,
  canTransition,
  computeCancelWindow,
  isTerminal,
  isWithinCancelWindow,
  planTransition,
  type OrderStatus,
} from './order-state-machine';

describe('order state machine', () => {
  describe('happy path', () => {
    it('walks the full COD lifecycle from placed to delivered', () => {
      const path: OrderStatus[] = [
        'PLACED',
        'PENDING_VERIFICATION',
        'CONFIRMED',
        'PACKED',
        'HANDED_TO_COURIER',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
      ];

      for (let i = 0; i < path.length - 1; i += 1) {
        const from = path[i] as OrderStatus;
        const to = path[i + 1] as OrderStatus;
        expect(canTransition(from, to)).toBe(true);
        expect(() => planTransition({ from, to })).not.toThrow();
      }
    });

    it('stamps the right timestamp column for each milestone', () => {
      expect(planTransition({ from: 'PLACED', to: 'CONFIRMED' }).timestampFields).toEqual([
        'confirmedAt',
      ]);
      expect(planTransition({ from: 'OUT_FOR_DELIVERY', to: 'DELIVERED' }).timestampFields).toEqual(
        ['deliveredAt'],
      );
      expect(planTransition({ from: 'CONFIRMED', to: 'CANCELLED' }).timestampFields).toEqual([
        'cancelledAt',
      ]);
      expect(planTransition({ from: 'DELIVERED', to: 'RETURNED' }).timestampFields).toEqual([
        'returnedAt',
      ]);
    });
  });

  describe('illegal transitions', () => {
    it('refuses to skip fulfilment steps', () => {
      expect(canTransition('PLACED', 'DELIVERED')).toBe(false);
      expect(() => planTransition({ from: 'PLACED', to: 'DELIVERED' })).toThrow(
        BadRequestException,
      );
    });

    it('refuses to move backwards from a terminal state', () => {
      expect(() => planTransition({ from: 'CANCELLED', to: 'CONFIRMED' })).toThrow(
        BadRequestException,
      );
      expect(() => planTransition({ from: 'RETURNED', to: 'DELIVERED' })).toThrow(
        BadRequestException,
      );
    });

    it('refuses a no-op transition', () => {
      expect(() => planTransition({ from: 'CONFIRMED', to: 'CONFIRMED' })).toThrow(
        /already CONFIRMED/,
      );
    });

    it('cannot cancel a parcel that is already in transit', () => {
      expect(canTransition('IN_TRANSIT', 'CANCELLED')).toBe(false);
    });
  });

  describe('admin manual override', () => {
    it('permits any transition when an override reason is supplied', () => {
      const plan = planTransition({
        from: 'PLACED',
        to: 'DELIVERED',
        isOverride: true,
        reason: 'Hand-delivered by the founder at a pop-up stall',
      });
      expect(plan.isOverride).toBe(true);
      expect(plan.timestampFields).toEqual(['deliveredAt']);
    });

    it('rejects an override without a reason so the audit trail stays useful', () => {
      expect(() => planTransition({ from: 'PLACED', to: 'DELIVERED', isOverride: true })).toThrow(
        /requires a reason/,
      );
    });
  });

  describe('side effects', () => {
    it('notifies the customer at every milestone the brief lists', () => {
      const notifying: OrderStatus[] = [
        'CONFIRMED',
        'HANDED_TO_COURIER',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'RETURNED',
      ];
      for (const status of notifying) {
        const plan = planTransition({
          from: 'PLACED',
          to: status,
          isOverride: true,
          reason: 'test',
        });
        expect(plan.notifyCustomer).toBe(true);
      }
      expect(planTransition({ from: 'CONFIRMED', to: 'PACKED' }).notifyCustomer).toBe(false);
    });

    it('restocks only on cancel and return', () => {
      expect(planTransition({ from: 'CONFIRMED', to: 'CANCELLED' }).restock).toBe(true);
      expect(planTransition({ from: 'DELIVERED', to: 'RETURNED' }).restock).toBe(true);
      expect(planTransition({ from: 'CONFIRMED', to: 'PACKED' }).restock).toBe(false);
    });

    it('maps statuses to the analytics event stream', () => {
      expect(planTransition({ from: 'PLACED', to: 'CONFIRMED' }).marketingEvent).toBe(
        'ORDER_CONFIRMED',
      );
      expect(planTransition({ from: 'OUT_FOR_DELIVERY', to: 'DELIVERED' }).marketingEvent).toBe(
        'ORDER_DELIVERED',
      );
      expect(planTransition({ from: 'PLACED', to: 'CANCELLED' }).marketingEvent).toBe(
        'CANCEL_PURCHASE',
      );
      expect(planTransition({ from: 'PLACED', to: 'ON_HOLD' }).marketingEvent).toBe(
        'ORDER_ON_HOLD',
      );
    });

    it('supports recovering an on-hold order', () => {
      expect(canTransition('ON_HOLD', 'CONFIRMED')).toBe(true);
    });
  });

  describe('invariants', () => {
    it('never lets a terminal status transition onwards, except delivered → returned', () => {
      expect(allowedTransitions('CANCELLED')).toHaveLength(0);
      expect(allowedTransitions('RETURNED')).toHaveLength(0);
      expect(allowedTransitions('DELIVERED')).toEqual(['RETURNED']);
    });

    it('declares every status reachable in the transition table', () => {
      for (const status of ORDER_STATUSES) {
        expect(allowedTransitions(status)).toBeDefined();
      }
    });

    it('flags the three terminal states', () => {
      expect(isTerminal('DELIVERED')).toBe(true);
      expect(isTerminal('RETURNED')).toBe(true);
      expect(isTerminal('CANCELLED')).toBe(true);
      expect(isTerminal('IN_TRANSIT')).toBe(false);
    });
  });

  describe('cancel window', () => {
    const placedAt = new Date('2026-01-01T10:00:00Z');

    it('computes a two-hour default window', () => {
      expect(computeCancelWindow(placedAt).toISOString()).toBe('2026-01-01T12:00:00.000Z');
    });

    it('allows self-service cancellation inside the window', () => {
      const until = computeCancelWindow(placedAt);
      expect(isWithinCancelWindow(until, new Date('2026-01-01T11:59:00Z'))).toBe(true);
    });

    it('blocks self-service cancellation after the window', () => {
      const until = computeCancelWindow(placedAt);
      expect(isWithinCancelWindow(until, new Date('2026-01-01T12:00:01Z'))).toBe(false);
      expect(isWithinCancelWindow(null)).toBe(false);
    });
  });
});
