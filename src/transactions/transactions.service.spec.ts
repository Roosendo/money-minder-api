import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";

describe("TransactionsService", () => {
  let prisma: any;
  let ledger: any;
  let service: TransactionsService;

  const assetAccount = {
    id: "acc1",
    user_id: "u1",
    type: "bank",
    is_active: true,
  };
  const creditCardAccount = {
    id: "card1",
    user_id: "u1",
    type: "credit_card",
    is_active: true,
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (arg: any) =>
        typeof arg === "function" ? arg(prisma) : Promise.all(arg),
      ),
      accounts: { findFirst: jest.fn() },
      categories: { findFirst: jest.fn() },
      transactions: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      account_movements: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    ledger = {
      createInTransaction: jest.fn(),
      replaceMovementsInTransaction: jest.fn(),
      findReversedTransactionIds: jest.fn().mockResolvedValue(new Set()),
      findTransactionWithMovements: jest.fn(),
      reverseTransaction: jest.fn(),
      hardDeleteTransaction: jest.fn(),
    };
    service = new TransactionsService(prisma, ledger);
    jest.spyOn(service, "getById").mockResolvedValue({ id: "tx1" } as any);
  });

  it("rejects an account that does not belong to the authenticated user", async () => {
    prisma.accounts.findFirst.mockResolvedValue(null);

    await expect(
      service.create("u1", { type: "income", amount: "10.00", accountId: "other-account" }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(ledger.createInTransaction).not.toHaveBeenCalled();
  });

  it("requires a direction for adjustments", async () => {
    await expect(
      service.create("u1", { type: "adjustment", amount: "10.00", accountId: "acc1" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects another user's private category", async () => {
    prisma.accounts.findFirst.mockResolvedValue(assetAccount);
    prisma.categories.findFirst.mockResolvedValue(null);

    await expect(
      service.create("u1", {
        type: "expense",
        amount: "10.00",
        accountId: "acc1",
        categoryId: "other-category",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(ledger.createInTransaction).not.toHaveBeenCalled();
  });

  it("records income as a positive movement on an asset account", async () => {
    prisma.accounts.findFirst.mockResolvedValue(assetAccount);
    ledger.createInTransaction.mockResolvedValue({ id: "tx1" });

    await service.create("u1", { type: "income", amount: "100.00", accountId: "acc1" });

    expect(ledger.createInTransaction).toHaveBeenCalledWith(
      prisma,
      "u1",
      expect.objectContaining({ type: "income", amount: "100.00" }),
      [{ accountId: "acc1", amount: expect.anything() }],
    );
    const movements = ledger.createInTransaction.mock.calls[0][3];
    expect(movements[0].amount.toFixed(2)).toBe("100.00");
  });

  it("records a credit card purchase as an increase in debt", async () => {
    prisma.accounts.findFirst.mockResolvedValue(creditCardAccount);
    ledger.createInTransaction.mockResolvedValue({ id: "tx1" });

    await service.create("u1", { type: "expense", amount: "25.00", accountId: "card1" });

    const movements = ledger.createInTransaction.mock.calls[0][3];
    expect(movements[0].amount.toFixed(2)).toBe("25.00");
  });

  it("does not allow editing a reversed transaction", async () => {
    prisma.transactions.findFirst
      .mockResolvedValueOnce({
        id: "tx1",
        user_id: "u1",
        type: "income",
        amount: { toString: () => "10.00", gt: () => true },
        account_movements: [{ account_id: "acc1", amount: { gt: () => true } }],
      })
      .mockResolvedValueOnce({ id: "reversal1" });

    await expect(service.update("u1", "tx1", { amount: "20.00" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("filters account history by the authenticated user's movements", async () => {
    prisma.transactions.findMany.mockResolvedValue([]);
    prisma.transactions.count.mockResolvedValue(0);

    await service.list("u1", {
      page: 1,
      pageSize: 10,
      accountId: "acc1",
      includeReversed: true,
    });

    expect(prisma.transactions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          user_id: "u1",
          account_movements: { some: { account_id: "acc1", user_id: "u1" } },
        }),
      }),
    );
  });
});
