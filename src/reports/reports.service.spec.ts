import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
  let prisma: any;
  let service: ReportsService;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    service = new ReportsService(prisma, {} as any);
  });

  it("computes net as income - expenses - transfer fees", async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          income: "1000.00",
          expenses: "250.00",
          adjustments: "0.00",
          income_count: 2,
          expense_count: 3,
          adjustment_count: 0,
        },
      ])
      .mockResolvedValueOnce([{ fees: "10.00" }]);

    const summary = await service.getSummary(
      "u1",
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-01-31T23:59:59.999Z"),
    );

    expect(summary.income).toBe("1000.00");
    expect(summary.expenses).toBe("250.00");
    expect(summary.transferFees).toBe("10.00");
    expect(summary.expensesIncludingTransferFees).toBe("260.00");
    expect(summary.net).toBe("740.00");
    expect(summary.counts).toEqual({ income: 2, expenses: 3, adjustments: 0 });
  });

  it("fills missing months with zero values", async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { month: "2026-01", income: "100.00", expenses: "25.00", fees: "0.00" },
      ])
      .mockResolvedValueOnce([]);

    const series = await service.getMonthlySeries("u1", 2026, false);

    expect(series).toHaveLength(12);
    expect(series[0]).toEqual({
      month: "2026-01",
      income: "100.00",
      expenses: "25.00",
      transferFees: "0.00",
      net: "75.00",
    });
    expect(series[1].income).toBe("0.00");
    expect(series[11].net).toBe("0.00");
  });

  it("subtracts transfer fees from the monthly net even when they are not itemized", async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { month: "2026-01", income: "100.00", expenses: "25.00", fees: "0.00" },
      ])
      .mockResolvedValueOnce([{ month: "2026-01", fees: "5.00" }]);

    const series = await service.getMonthlySeries("u1", 2026, false);

    expect(series[0].transferFees).toBe("5.00");
    expect(series[0].net).toBe("70.00");
  });
});
