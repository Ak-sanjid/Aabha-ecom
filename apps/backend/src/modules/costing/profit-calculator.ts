/**
 * Costing & profit calculator.
 *
 * Every monetary value is an integer in poisha (1 BDT = 100) — no floats
 * anywhere in the money path. Rates are basis points (200 = 2.00%).
 *
 * Section 7 calls this out as one of the two highest-risk areas for silent
 * bugs, so the module is pure and exhaustively unit-tested.
 */

export interface CostInputs {
  importCostMinor?: number;
  purchaseCostMinor?: number;
  transportCostMinor?: number;
  warehouseCostMinor?: number;
  overheadCostMinor?: number;
  deliveryCostMinor?: number;
  packagingCostMinor?: number;
  marketingCostMinor?: number;
  /** Payment-gateway fee on the selling price, in basis points. */
  gatewayFeeBps?: number;
  /** VAT applied to the selling price, in basis points. */
  vatBps?: number;
}

export interface ProfitBreakdown {
  /** Sum of all fixed per-unit costs. */
  landedCostMinor: number;
  gatewayFeeMinor: number;
  vatMinor: number;
  /** Landed cost + gateway fee + VAT. */
  totalCostMinor: number;
  sellingPriceMinor: number;
  grossProfitMinor: number;
  netProfitMinor: number;
  /** Net margin in basis points (2500 = 25.00%). */
  marginBps: number;
  /** Net markup over total cost, in basis points. */
  markupBps: number;
  isLoss: boolean;
}

/** Banker-safe integer rounding for basis-point maths. */
export function applyBps(amountMinor: number, bps: number): number {
  assertInteger(amountMinor, 'amountMinor');
  assertInteger(bps, 'bps');
  return Math.round((amountMinor * bps) / 10_000);
}

function assertInteger(value: number, field: string): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${field} must be an integer in the smallest currency unit, got ${value}`);
  }
}

function normalize(costs: CostInputs): Required<CostInputs> {
  const normalized: Required<CostInputs> = {
    importCostMinor: costs.importCostMinor ?? 0,
    purchaseCostMinor: costs.purchaseCostMinor ?? 0,
    transportCostMinor: costs.transportCostMinor ?? 0,
    warehouseCostMinor: costs.warehouseCostMinor ?? 0,
    overheadCostMinor: costs.overheadCostMinor ?? 0,
    deliveryCostMinor: costs.deliveryCostMinor ?? 0,
    packagingCostMinor: costs.packagingCostMinor ?? 0,
    marketingCostMinor: costs.marketingCostMinor ?? 0,
    gatewayFeeBps: costs.gatewayFeeBps ?? 0,
    vatBps: costs.vatBps ?? 0,
  };
  for (const [field, value] of Object.entries(normalized)) {
    assertInteger(value, field);
    if (value < 0) throw new RangeError(`${field} cannot be negative`);
  }
  return normalized;
}

/** Sum of the fixed per-unit costs, excluding percentage-based fees. */
export function calculateLandedCost(costs: CostInputs): number {
  const c = normalize(costs);
  return (
    c.importCostMinor +
    c.purchaseCostMinor +
    c.transportCostMinor +
    c.warehouseCostMinor +
    c.overheadCostMinor +
    c.deliveryCostMinor +
    c.packagingCostMinor +
    c.marketingCostMinor
  );
}

/** Full profit breakdown for a single unit at a given selling price. */
export function calculateProfit(sellingPriceMinor: number, costs: CostInputs): ProfitBreakdown {
  assertInteger(sellingPriceMinor, 'sellingPriceMinor');
  if (sellingPriceMinor < 0) throw new RangeError('sellingPriceMinor cannot be negative');

  const c = normalize(costs);
  const landedCostMinor = calculateLandedCost(c);
  const gatewayFeeMinor = applyBps(sellingPriceMinor, c.gatewayFeeBps);
  const vatMinor = applyBps(sellingPriceMinor, c.vatBps);
  const totalCostMinor = landedCostMinor + gatewayFeeMinor + vatMinor;

  const grossProfitMinor = sellingPriceMinor - landedCostMinor;
  const netProfitMinor = sellingPriceMinor - totalCostMinor;

  return {
    landedCostMinor,
    gatewayFeeMinor,
    vatMinor,
    totalCostMinor,
    sellingPriceMinor,
    grossProfitMinor,
    netProfitMinor,
    marginBps:
      sellingPriceMinor === 0 ? 0 : Math.round((netProfitMinor * 10_000) / sellingPriceMinor),
    markupBps: totalCostMinor === 0 ? 0 : Math.round((netProfitMinor * 10_000) / totalCostMinor),
    isLoss: netProfitMinor < 0,
  };
}

export interface OrderLineForProfit {
  quantity: number;
  unitPriceMinor: number;
  discountMinor?: number;
  costs: CostInputs;
}

export interface OrderProfit {
  revenueMinor: number;
  discountMinor: number;
  costMinor: number;
  netProfitMinor: number;
  marginBps: number;
  lines: Array<ProfitBreakdown & { quantity: number; lineProfitMinor: number }>;
}

/**
 * Aggregates profit across an order. Discounts are applied per line before the
 * percentage-based fees, mirroring how gateways actually charge.
 */
export function calculateOrderProfit(
  lines: OrderLineForProfit[],
  extra: { shippingCostMinor?: number; shippingChargedMinor?: number } = {},
): OrderProfit {
  const shippingCostMinor = extra.shippingCostMinor ?? 0;
  const shippingChargedMinor = extra.shippingChargedMinor ?? 0;
  assertInteger(shippingCostMinor, 'shippingCostMinor');
  assertInteger(shippingChargedMinor, 'shippingChargedMinor');

  let revenueMinor = shippingChargedMinor;
  let discountTotalMinor = 0;
  let costMinor = shippingCostMinor;
  const breakdowns: OrderProfit['lines'] = [];

  for (const line of lines) {
    assertInteger(line.quantity, 'quantity');
    if (line.quantity <= 0) throw new RangeError('quantity must be greater than zero');

    const discountMinor = line.discountMinor ?? 0;
    assertInteger(discountMinor, 'discountMinor');

    const grossLineMinor = line.unitPriceMinor * line.quantity;
    const netLineMinor = grossLineMinor - discountMinor;
    if (netLineMinor < 0) throw new RangeError('Line discount exceeds the line total');

    // Effective unit price after the line-level discount, rounded to poisha.
    const effectiveUnitMinor = Math.round(netLineMinor / line.quantity);
    const perUnit = calculateProfit(effectiveUnitMinor, line.costs);
    const lineProfitMinor = perUnit.netProfitMinor * line.quantity;

    revenueMinor += netLineMinor;
    discountTotalMinor += discountMinor;
    costMinor += perUnit.totalCostMinor * line.quantity;
    breakdowns.push({ ...perUnit, quantity: line.quantity, lineProfitMinor });
  }

  const netProfitMinor = revenueMinor - costMinor;
  return {
    revenueMinor,
    discountMinor: discountTotalMinor,
    costMinor,
    netProfitMinor,
    marginBps: revenueMinor === 0 ? 0 : Math.round((netProfitMinor * 10_000) / revenueMinor),
    lines: breakdowns,
  };
}

/** Suggests a selling price that hits a target net margin, in poisha. */
export function suggestPriceForMargin(costs: CostInputs, targetMarginBps: number): number {
  const c = normalize(costs);
  if (targetMarginBps >= 10_000) {
    throw new RangeError('Target margin must be below 100%');
  }
  const landed = calculateLandedCost(c);
  // price = landed / (1 - margin - gatewayRate - vatRate)
  const denominator = 10_000 - targetMarginBps - c.gatewayFeeBps - c.vatBps;
  if (denominator <= 0) {
    throw new RangeError('Fees and target margin leave no room for a positive price');
  }
  return Math.ceil((landed * 10_000) / denominator);
}
