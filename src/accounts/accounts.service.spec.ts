import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AccountsService } from "./accounts.service";

describe("AccountsService", () => {
  let prisma: any;
  let ownership: any;
  let balances: any;
  let service: AccountsService;

  beforeEach(() => {
    prisma = {
      accounts: { create: jest.fn(), update: jest.fn(), delete: jest.fn(), findFirst: jest.fn() },
      account_movements: { count: jest.fn().mockResolvedValue(0) },
      debit_cards: { count: jest.fn().mockResolvedValue(0) },
      credit_card_details: { count: jest.fn().mockResolvedValue(0) },
      transfers: { count: jest.fn().mockResolvedValue(0) },
      entries: { count: jest.fn().mockResolvedValue(0) },
      exits: { count: jest.fn().mockResolvedValue(0) },
    };
    ownership = { requireAccount: jest.fn() };
    balances = { getBalance: jest.fn(), getBalances: jest.fn() };
    service = new AccountsService(prisma, ownership, balances);
    jest.spyOn(service, "getAccount").mockResolvedValue({ id: "a1" } as any);
  });

  it("creates credit cards only through the credit-card endpoint", async () => {
    await expect(
      service.createAccount("u1", { name: "Card", type: "credit_card" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("scopes updates to the authenticated user's account", async () => {
    ownership.requireAccount.mockRejectedValue(new NotFoundException("Account not found"));

    await expect(service.updateAccount("u1", "other", { name: "X" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.accounts.update).not.toHaveBeenCalled();
  });

  it("archives instead of deleting by default", async () => {
    ownership.requireAccount.mockResolvedValue({ id: "a1", user_id: "u1" });

    const result = await service.deleteAccount("u1", "a1");

    expect(prisma.accounts.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { is_active: false },
    });
    expect(prisma.accounts.delete).not.toHaveBeenCalled();
    expect(result).toEqual({ archived: true, id: "a1" });
  });

  it("refuses to hard-delete an account with ledger history", async () => {
    ownership.requireAccount.mockResolvedValue({ id: "a1", user_id: "u1" });
    prisma.account_movements.count.mockResolvedValue(1);

    await expect(service.deleteAccount("u1", "a1", true)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.accounts.delete).not.toHaveBeenCalled();
  });
});
