import { NotFoundException, BadRequestException } from "@nestjs/common";
import { OwnershipService } from "./ownership.service";

describe("OwnershipService", () => {
  let prisma: any;
  let service: OwnershipService;

  beforeEach(() => {
    prisma = {
      accounts: { findFirst: jest.fn() },
      categories: { findFirst: jest.fn() },
      credit_card_details: { findFirst: jest.fn() },
      transactions: { findFirst: jest.fn() },
      transfers: { findFirst: jest.fn() },
      debit_cards: { findFirst: jest.fn() },
    };
    service = new OwnershipService(prisma);
  });

  it("scopes account lookups by the authenticated user", async () => {
    prisma.accounts.findFirst.mockResolvedValue({
      id: "a1",
      user_id: "u1",
      is_active: true,
      type: "bank",
    });

    await service.requireAccount("u1", "a1");

    expect(prisma.accounts.findFirst).toHaveBeenCalledWith({
      where: { id: "a1", user_id: "u1" },
    });
  });

  it("does not reveal another user's account", async () => {
    prisma.accounts.findFirst.mockResolvedValue(null);
    await expect(service.requireAccount("u1", "other-users-account")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("rejects archived accounts when active is required", async () => {
    prisma.accounts.findFirst.mockResolvedValue({
      id: "a1",
      user_id: "u1",
      is_active: false,
      type: "bank",
    });
    await expect(
      service.requireAccount("u1", "a1", { requireActive: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts global and user categories but not another user's category", async () => {
    prisma.categories.findFirst.mockResolvedValue({
      id: "c1",
      user_id: null,
      name: "Groceries",
      type: "expense",
    });

    await service.requireCategory("u1", "c1", "expense");
    expect(prisma.categories.findFirst).toHaveBeenCalledWith({
      where: { id: "c1", OR: [{ user_id: "u1" }, { user_id: null }] },
    });

    prisma.categories.findFirst.mockResolvedValue(null);
    await expect(service.requireCategory("u1", "other-category", "expense")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("rejects a category whose type does not match the transaction", async () => {
    prisma.categories.findFirst.mockResolvedValue({
      id: "c1",
      user_id: "u1",
      name: "Salary",
      type: "income",
    });
    await expect(service.requireCategory("u1", "c1", "expense")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("requires credit card details owned by the user", async () => {
    prisma.accounts.findFirst.mockResolvedValue({
      id: "card1",
      user_id: "u1",
      is_active: true,
      type: "credit_card",
    });
    prisma.credit_card_details.findFirst.mockResolvedValue(null);

    await expect(service.requireCreditCardAccount("u1", "card1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("scopes debit cards through their account ownership", async () => {
    prisma.debit_cards.findFirst.mockResolvedValue(null);
    await expect(service.requireDebitCard("u1", "card1")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.debit_cards.findFirst).toHaveBeenCalledWith({
      where: { id: "card1", accounts: { user_id: "u1" } },
      include: { accounts: true },
    });
  });
});
