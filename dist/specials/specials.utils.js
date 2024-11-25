"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestTransactions = exports.getCategoryTotalsDetailed = exports.getMonthlyBalance = void 0;
const prisma_service_1 = require("../prisma.service");
const prisma = new prisma_service_1.PrismaService();
const getMonthlyBalance = async (year, userEmail) => {
    const incomes = await prisma.money_entries.groupBy({
        by: ['date'],
        where: {
            user_email: userEmail,
            date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            }
        },
        _sum: {
            amount: true,
        },
    });
    const expenses = await prisma.money_exits.groupBy({
        by: ['date'],
        where: {
            user_email: userEmail,
            date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            }
        },
        _sum: {
            amount: true,
        },
    });
    const monthlyBalance = new Map();
    for (let i = 1; i <= 12; i++) {
        const month = i.toString().padStart(2, '0');
        monthlyBalance.set(month, { ingresos: 0, egresos: 0 });
    }
    incomes.forEach((income) => {
        const month = income.date.getMonth() + 1;
        const monthStr = month.toString().padStart(2, '0');
        const current = monthlyBalance.get(monthStr);
        monthlyBalance.set(monthStr, {
            ...current,
            ingresos: income._sum.amount || 0,
        });
    });
    expenses.forEach((expense) => {
        const month = expense.date.getMonth() + 1;
        const monthStr = month.toString().padStart(2, '0');
        const current = monthlyBalance.get(monthStr);
        monthlyBalance.set(monthStr, {
            ...current,
            egresos: expense._sum.amount || 0,
        });
    });
    return Array.from(monthlyBalance.entries())
        .map(([month, values]) => ({
        month,
        total_ingresos: values.ingresos,
        total_egresos: values.egresos,
    }))
        .sort((a, b) => a.month.localeCompare(b.month));
};
exports.getMonthlyBalance = getMonthlyBalance;
const getCategoryTotalsDetailed = async (year, userEmail) => {
    const incomes = await prisma.money_entries.groupBy({
        by: ['category'],
        where: {
            user_email: userEmail,
            date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            }
        },
        _sum: {
            amount: true
        }
    });
    const expenses = await prisma.money_exits.groupBy({
        by: ['category'],
        where: {
            user_email: userEmail,
            date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            }
        },
        _sum: {
            amount: true
        }
    });
    const categoryTotals = new Map();
    [...incomes, ...expenses].forEach(item => {
        if (!categoryTotals.has(item.category)) {
            categoryTotals.set(item.category, {
                ingresos: 0,
                egresos: 0,
                total: 0
            });
        }
    });
    incomes.forEach((income) => {
        const current = categoryTotals.get(income.category);
        const amount = income._sum.amount || 0;
        categoryTotals.set(income.category, {
            ...current,
            ingresos: amount,
            total: current.total + amount
        });
    });
    expenses.forEach((expense) => {
        const current = categoryTotals.get(expense.category);
        const amount = expense._sum.amount || 0;
        categoryTotals.set(expense.category, {
            ...current,
            egresos: amount,
            total: current.total + amount
        });
    });
    return Array.from(categoryTotals.entries()).map(([category, values]) => ({
        category,
        ...values
    }));
};
exports.getCategoryTotalsDetailed = getCategoryTotalsDetailed;
const getLatestTransactions = async (year, userEmail) => {
    const latestEntries = await prisma.money_entries.findMany({
        where: {
            user_email: userEmail,
            date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            }
        },
        select: {
            date: true,
            category: true,
            amount: true,
        },
        orderBy: {
            entry_id: 'desc'
        },
        take: 4
    });
    const latestExits = await prisma.money_exits.findMany({
        where: {
            user_email: userEmail,
            date: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            }
        },
        select: {
            date: true,
            category: true,
            amount: true,
        },
        orderBy: {
            exit_id: 'desc'
        },
        take: 4
    });
    const allTransactions = [...latestEntries, ...latestExits]
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    return allTransactions;
};
exports.getLatestTransactions = getLatestTransactions;
//# sourceMappingURL=specials.utils.js.map