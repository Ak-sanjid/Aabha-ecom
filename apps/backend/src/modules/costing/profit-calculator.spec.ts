import {
  applyBps,
  calculateLandedCost,
  calculateOrderProfit,
  calculateProfit,
  suggestPriceForMargin,
} from './profit-calculator';

// 1 BDT = 100 poisha. Helper keeps the tests readable.
const taka = (amount: number): number => Math.round(amount * 100);

describe('profit calculator', () => {
  describe('applyBps', () => {
    it('applies basis points and rounds to the nearest poisha', () => {
      expect(applyBps(taka(1000), 200)).toBe(taka(20));
      expect(applyBps(333, 150)).toBe(5); // 4.995 → 5
    });

    it('rejects non-integer money', () => {
      expect(() => applyBps(10.5, 100)).toThrow(TypeError);
    });
  });

  describe('calculateLandedCost', () => {
    it('sums every fixed cost field', () => {
      const landed = calculateLandedCost({
        importCostMinor: taka(400),
        purchaseCostMinor: taka(900),
        transportCostMinor: taka(60),
        warehouseCostMinor: taka(25),
        overheadCostMinor: taka(40),
        deliveryCostMinor: taka(70),
        packagingCostMinor: taka(15),
        marketingCostMinor: taka(90),
      });
      expect(landed).toBe(taka(1600));
    });

    it('treats missing fields as zero', () => {
      expect(calculateLandedCost({ purchaseCostMinor: taka(500) })).toBe(taka(500));
      expect(calculateLandedCost({})).toBe(0);
    });

    it('rejects negative costs', () => {
      expect(() => calculateLandedCost({ purchaseCostMinor: -1 })).toThrow(RangeError);
    });

    it('rejects float money, the classic silent-rounding bug', () => {
      expect(() => calculateLandedCost({ purchaseCostMinor: 199.99 })).toThrow(TypeError);
    });
  });

  describe('calculateProfit', () => {
    it('computes gross and net profit with gateway fee and VAT', () => {
      const result = calculateProfit(taka(2500), {
        purchaseCostMinor: taka(1200),
        transportCostMinor: taka(100),
        deliveryCostMinor: taka(80),
        packagingCostMinor: taka(20),
        gatewayFeeBps: 185, // bKash ≈ 1.85%
        vatBps: 500, // 5%
      });

      expect(result.landedCostMinor).toBe(taka(1400));
      expect(result.gatewayFeeMinor).toBe(4625); // 2500.00 × 1.85% = 46.25 BDT
      expect(result.vatMinor).toBe(taka(125));
      expect(result.totalCostMinor).toBe(taka(1400) + 4625 + taka(125));
      expect(result.grossProfitMinor).toBe(taka(1100));
      expect(result.netProfitMinor).toBe(taka(2500) - result.totalCostMinor);
      expect(result.isLoss).toBe(false);
    });

    it('reports a loss when the price sits below total cost', () => {
      const result = calculateProfit(taka(1000), {
        purchaseCostMinor: taka(1200),
        gatewayFeeBps: 200,
      });
      expect(result.isLoss).toBe(true);
      expect(result.netProfitMinor).toBeLessThan(0);
      expect(result.marginBps).toBeLessThan(0);
    });

    it('returns a zero margin for a free item instead of dividing by zero', () => {
      const result = calculateProfit(0, {});
      expect(result.marginBps).toBe(0);
      expect(result.markupBps).toBe(0);
    });

    it('expresses margin in basis points', () => {
      const result = calculateProfit(taka(1000), { purchaseCostMinor: taka(750) });
      expect(result.marginBps).toBe(2500); // 25.00%
    });

    it('never produces fractional poisha', () => {
      const result = calculateProfit(1_337, { purchaseCostMinor: 411, gatewayFeeBps: 237 });
      for (const value of [
        result.landedCostMinor,
        result.gatewayFeeMinor,
        result.vatMinor,
        result.totalCostMinor,
        result.netProfitMinor,
      ]) {
        expect(Number.isInteger(value)).toBe(true);
      }
    });
  });

  describe('calculateOrderProfit', () => {
    it('aggregates multiple lines including shipping', () => {
      const order = calculateOrderProfit(
        [
          {
            quantity: 2,
            unitPriceMinor: taka(1500),
            costs: { purchaseCostMinor: taka(900), gatewayFeeBps: 200 },
          },
          {
            quantity: 1,
            unitPriceMinor: taka(800),
            costs: { purchaseCostMinor: taka(500) },
          },
        ],
        { shippingChargedMinor: taka(60), shippingCostMinor: taka(90) },
      );

      // Revenue: 2×1500 + 800 + 60 shipping charged
      expect(order.revenueMinor).toBe(taka(3860));
      expect(order.lines).toHaveLength(2);
      expect(order.netProfitMinor).toBe(order.revenueMinor - order.costMinor);
      // Shipping is subsidised by 30 BDT, which must show up in cost.
      expect(order.costMinor).toBeGreaterThan(taka(2300));
    });

    it('applies line discounts before percentage fees', () => {
      const order = calculateOrderProfit([
        {
          quantity: 2,
          unitPriceMinor: taka(1000),
          discountMinor: taka(200),
          costs: { purchaseCostMinor: taka(600), gatewayFeeBps: 200 },
        },
      ]);

      expect(order.revenueMinor).toBe(taka(1800));
      expect(order.discountMinor).toBe(taka(200));
      // Effective unit price 900 BDT → 2% gateway fee = 18 BDT per unit.
      expect(order.lines[0]?.gatewayFeeMinor).toBe(taka(18));
    });

    it('rejects a discount larger than the line total', () => {
      expect(() =>
        calculateOrderProfit([
          { quantity: 1, unitPriceMinor: taka(100), discountMinor: taka(200), costs: {} },
        ]),
      ).toThrow(RangeError);
    });

    it('rejects a non-positive quantity', () => {
      expect(() =>
        calculateOrderProfit([{ quantity: 0, unitPriceMinor: taka(100), costs: {} }]),
      ).toThrow(RangeError);
    });

    it('returns zeros for an empty order', () => {
      const order = calculateOrderProfit([]);
      expect(order.revenueMinor).toBe(0);
      expect(order.netProfitMinor).toBe(0);
      expect(order.marginBps).toBe(0);
    });
  });

  describe('suggestPriceForMargin', () => {
    it('suggests a price that actually hits the target margin', () => {
      const costs = { purchaseCostMinor: taka(1000), gatewayFeeBps: 200 };
      const price = suggestPriceForMargin(costs, 3000); // 30%
      const achieved = calculateProfit(price, costs);
      expect(achieved.marginBps).toBeGreaterThanOrEqual(3000);
      // And it should not massively overshoot.
      expect(achieved.marginBps).toBeLessThan(3030);
    });

    it('refuses impossible targets', () => {
      expect(() => suggestPriceForMargin({ purchaseCostMinor: 100 }, 10_000)).toThrow(RangeError);
      expect(() =>
        suggestPriceForMargin({ purchaseCostMinor: 100, gatewayFeeBps: 5000 }, 5000),
      ).toThrow(RangeError);
    });
  });
});
