import { Prisma } from "@prisma/client";

/**
 * Financial values are represented as `Prisma.Decimal` (decimal.js) inside the
 * application and serialized as strings at the API boundary. Never use
 * JavaScript floating point arithmetic for money.
 */
export type MoneyLike = string | number | Prisma.Decimal;

export const MAX_MONEY = "9999999999.99";
export const POSITIVE_MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
export const SIGNED_MONEY_PATTERN = /^-?\d+(\.\d{1,2})?$/;

export const dec = (value: MoneyLike): Prisma.Decimal => new Prisma.Decimal(value);

export const ZERO = () => new Prisma.Decimal(0);

/** Formats a value with exactly two decimal places for API responses. */
export const money = (value: MoneyLike): string => dec(value).toFixed(2);

/** Returns the value unchanged for storage in a Decimal column. */
export const decimal = (value: MoneyLike): Prisma.Decimal => dec(value);

export const add = (a: MoneyLike, b: MoneyLike): Prisma.Decimal => dec(a).plus(dec(b));
export const sub = (a: MoneyLike, b: MoneyLike): Prisma.Decimal => dec(a).minus(dec(b));
export const abs = (value: MoneyLike): Prisma.Decimal => dec(value).abs();
export const negate = (value: MoneyLike): Prisma.Decimal => dec(value).negated();

export const sumMoney = (values: MoneyLike[]): Prisma.Decimal =>
  values.reduce<Prisma.Decimal>((total, value) => total.plus(dec(value)), ZERO());

export const isZero = (value: MoneyLike): boolean => dec(value).isZero();
export const isPositive = (value: MoneyLike): boolean => dec(value).gt(0);
export const isNegative = (value: MoneyLike): boolean => dec(value).lt(0);
export const gte = (a: MoneyLike, b: MoneyLike): boolean => dec(a).gte(dec(b));
export const lte = (a: MoneyLike, b: MoneyLike): boolean => dec(a).lte(dec(b));
export const gt = (a: MoneyLike, b: MoneyLike): boolean => dec(a).gt(dec(b));
export const lt = (a: MoneyLike, b: MoneyLike): boolean => dec(a).lt(dec(b));

/** Validates that a money string has at most 2 decimals and fits Decimal(12,2). */
export const isValidMoney = (value: string, signed = false): boolean => {
  if (typeof value !== "string") return false;
  const pattern = signed ? SIGNED_MONEY_PATTERN : POSITIVE_MONEY_PATTERN;
  if (!pattern.test(value)) return false;
  const parsed = dec(value);
  return parsed.abs().lte(MAX_MONEY);
};

/** Smallest allowed non-zero money value for a Decimal(12,2) column. */
export const MIN_MONEY = "0.01";
