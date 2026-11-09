import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TransfersService } from "./transfers.service";

describe("TransfersService", () => {
  let prisma: any;
  let ledger: any;
  let transactions: any;
  let service: TransfersService;

  const fromAccount = { id: "from", user_id: "u1", type: "bank", is_active: true };
  const toAccount = { id: "to", user_id: "u1", type: "savings", is_active: true };
  const cardAccount = { id: "card", user_id: "u1", type: "credit_card", is_active: true };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(async (arg: any) =>
        typeof arg === "function" ? arg(prisma) : Promise.all(arg),
      ),
      accounts: { findMany: jest.fn(), findFirst: jest.fn() },
      transfers: { create: jest.fn(), findFirst: jest.fn() },
      transactions: { findFirst: jest.fn(), update: jest.fn() },
      account_movements: { deleteMany: jest.fn(), createMany: jest.fn() },
    };
    ledger = {
      createInTransaction: jest.fn().mockResolvedValue({ id: "tx1" }),
      replaceMovementsInTransaction: jest.fn(),
      reverseTransaction: jest.fn(),
      hardDeleteTransaction: jest.fn(),
    };
    transactions = { getById: jest.fn().mockResolvedValue({ id: "tx1" }) };
    service = new TransfersService(prisma, ledger, transactions);
    jest.spyOn(service, "getById").mockResolvedValue({ id: "tx1" } as any);
  });

  it("rejects transferring an account to itself", async () => {
    await expect(
      service.create("u1", { fromAccountId: "a", toAccountId: "a", amount: "20.00" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a destination that is not owned by the user", async () => {
    prisma.accounts.findMany.mockResolvedValue([fromAccount]);

    await expect(
      service.create("u1", { fromAccountId: "from", toAccountId: "other", amount: "20.00" }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ledger.createInTransaction).not.toHaveBeenCalled();
  });

  it("rejects a credit card as the transfer source", async () => {
    prisma.accounts.findMany.mockResolvedValue([cardAccount, toAccount]);

    await expect(
      service.create("u1", { fromAccountId: "card", toAccountId: "to", amount: "20.00" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("debits the source by amount + fee and credits the destination by amount", async () => {
    prisma.accounts.findMany.mockResolvedValue([fromAccount, toAccount]);

    await service.create("u1", {
      fromAccountId: "from",
      toAccountId: "to",
      amount: "20.00",
      fee: "1.00",
    });

    const movements = ledger.createInTransaction.mock.calls[0][3];
    expect(movements).toHaveLength(2);
    expect(movements[0].amount.toFixed(2)).toBe("-21.00");
    expect(movements[1].amount.toFixed(2)).toBe("20.00");
    expect(prisma.transfers.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        transaction_id: "tx1",
        from_account_id: "from",
        to_account_id: "to",
        fee: expect.anything(),
        user_id: "u1",
      }),
    });
  });

  it("reduces credit card debt when the card is the destination", async () => {
    prisma.accounts.findMany.mockResolvedValue([fromAccount, cardAccount]);

    await service.create("u1", {
      fromAccountId: "from",
      toAccountId: "card",
      amount: "20.00",
      fee: "1.00",
    });

    const movements = ledger.createInTransaction.mock.calls[0][3];
    expect(movements[0].amount.toFixed(2)).toBe("-21.00");
    expect(movements[1].amount.toFixed(2)).toBe("-20.00");
  });

  it("computes transfer fees without creating an income/expense transaction", async () => {
    prisma.accounts.findMany.mockResolvedValue([fromAccount, toAccount]);

    await service.create("u1", {
      fromAccountId: "from",
      toAccountId: "to",
      amount: "20.00",
      fee: "1.00",
    });

    expect(ledger.createInTransaction).toHaveBeenCalledTimes(1);
    expect(ledger.createInTransaction.mock.calls[0][2].type).toBe("transfer");
  });
});
