"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoanDetails = void 0;
const prisma_service_1 = require("../prisma.service");
const prisma = new prisma_service_1.PrismaService();
const getLoanDetails = async (userEmail) => {
    const loanIds = await prisma.loans.findMany({
        where: {
            user_email: userEmail
        },
        select: {
            id: true
        }
    });
    const totalPayments = await prisma.payments.groupBy({
        by: ['loan_id'],
        where: {
            loan_id: {
                in: loanIds.map(loan => loan.id)
            }
        },
        _sum: {
            payment_amount: true
        },
    });
    const totalsMap = new Map(totalPayments.map(total => [
        total.loan_id,
        total._sum.payment_amount || 0
    ]));
    const loans = await prisma.loans.findMany({
        where: {
            user_email: userEmail
        },
        include: {
            payments: {
                orderBy: {
                    payment_date: 'desc'
                },
                take: 5,
                select: {
                    id: true,
                    payment_date: true,
                    payment_amount: true
                }
            }
        }
    });
    return loans.map(loan => ({
        ...loan,
        last_five_payments: loan.payments,
        total_payments: totalsMap.get(loan.id) || 0
    }));
};
exports.getLoanDetails = getLoanDetails;
//# sourceMappingURL=loans.utils.js.map