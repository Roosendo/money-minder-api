import { dec, isValidMoney, money, sumMoney } from "./money";

describe("money utilities", () => {
  it("keeps decimal arithmetic exact", () => {
    expect(money(dec("0.10").plus(dec("0.20")))).toBe("0.30");
    expect(money(sumMoney(["0.10", "0.20", "0.30"]))).toBe("0.60");
  });

  it("formats with two decimals", () => {
    expect(money("1")).toBe("1.00");
    expect(money("1.2")).toBe("1.20");
  });

  it("accepts valid positive money strings", () => {
    expect(isValidMoney("0.01")).toBe(true);
    expect(isValidMoney("9999999999.99")).toBe(true);
  });

  it("rejects floats, extra precision, negatives and overflow", () => {
    expect(isValidMoney("1.234")).toBe(false);
    expect(isValidMoney("-1.00")).toBe(false);
    expect(isValidMoney("1e3")).toBe(false);
    expect(isValidMoney("10000000000.00")).toBe(false);
  });

  it("allows signed values only when requested", () => {
    expect(isValidMoney("-1.00", true)).toBe(true);
    expect(isValidMoney("-1.00", false)).toBe(false);
  });
});
