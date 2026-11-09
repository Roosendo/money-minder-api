import {
  compareLedgerEntries,
  computeAvailableCredit,
  computeBalance,
  movementForTransaction,
  movementForTransfer,
} from "./ledger-rules";

const expectMoney = (value: { toFixed: (digits: number) => string }, expected: string) => {
  expect(value.toFixed(2)).toBe(expected);
};

describe("ledger rules", () => {
  describe("movementForTransaction", () => {
    it("adds income to asset accounts", () => {
      expectMoney(movementForTransaction("bank", "income", "100.00"), "100.00");
      expectMoney(movementForTransaction("cash", "income", "100.00"), "100.00");
      expectMoney(movementForTransaction("savings", "income", "100.00"), "100.00");
    });

    it("subtracts expenses from asset accounts", () => {
      expectMoney(movementForTransaction("bank", "expense", "25.00"), "-25.00");
    });

    it("increases credit card debt on purchases", () => {
      expectMoney(movementForTransaction("credit_card", "expense", "25.00"), "25.00");
    });

    it("reduces credit card debt on credits/refunds", () => {
      expectMoney(movementForTransaction("credit_card", "income", "10.00"), "-10.00");
    });

    it("supports signed adjustments", () => {
      expectMoney(movementForTransaction("bank", "adjustment", "5.00", "increase"), "5.00");
      expectMoney(movementForTransaction("bank", "adjustment", "5.00", "decrease"), "-5.00");
      expectMoney(movementForTransaction("credit_card", "adjustment", "5.00", "increase"), "5.00");
      expectMoney(movementForTransaction("credit_card", "adjustment", "5.00", "decrease"), "-5.00");
    });

    it("requires a direction for adjustments", () => {
      expect(() => movementForTransaction("bank", "adjustment", "5.00")).toThrow(/direction/);
    });
  });

  describe("movementForTransfer", () => {
    it("debits the source by amount + fee", () => {
      expectMoney(movementForTransfer("bank", "from", "20.00", "1.00"), "-21.00");
    });

    it("credits an asset destination by the principal", () => {
      expectMoney(movementForTransfer("savings", "to", "20.00"), "20.00");
    });

    it("reduces credit card debt when the card is the destination", () => {
      expectMoney(movementForTransfer("credit_card", "to", "20.00"), "-20.00");
    });

    it("refuses credit cards as a transfer source", () => {
      expect(() => movementForTransfer("credit_card", "from", "20.00", "1.00")).toThrow(
        /cannot be the source/,
      );
    });
  });

  describe("balances", () => {
    it("computes asset balances from opening balance plus signed movements", () => {
      expectMoney(computeBalance("100.00", ["100.00", "-25.00"]), "175.00");
    });

    it("computes credit card outstanding debt the same way", () => {
      expectMoney(computeBalance("50.00", ["25.00", "-10.00"]), "65.00");
    });

    it("computes available credit as limit minus outstanding debt", () => {
      expectMoney(computeAvailableCredit("1000.00", "250.00"), "750.00");
      expectMoney(computeAvailableCredit("1000.00", "1100.00"), "-100.00");
    });
  });

  describe("deterministic ordering", () => {
    it("orders by occurredAt, then createdAt, then transaction and movement id", () => {
      const base = new Date("2026-01-01T00:00:00.000Z");
      const later = new Date("2026-01-02T00:00:00.000Z");

      expect(
        compareLedgerEntries(
          { occurredAt: base, createdAt: base, transactionId: "a", movementId: "a" },
          { occurredAt: later, createdAt: base, transactionId: "a", movementId: "a" },
        ),
      ).toBeLessThan(0);

      expect(
        compareLedgerEntries(
          { occurredAt: base, createdAt: later, transactionId: "a", movementId: "a" },
          { occurredAt: base, createdAt: base, transactionId: "b", movementId: "b" },
        ),
      ).toBeGreaterThan(0);
    });
  });
});
