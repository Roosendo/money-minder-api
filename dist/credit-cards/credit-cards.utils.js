"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseRange = void 0;
const getPurchaseRange = (cutOffDate, paymentDueDate) => {
    const dueDate = new Date(paymentDueDate);
    const currentMonth = dueDate.getMonth() + 1;
    const currentYear = dueDate.getFullYear();
    const currentDay = dueDate.getDate();
    let startDate;
    let endDate;
    if (currentDay > cutOffDate) {
        startDate = `${currentYear}-${currentMonth}-${cutOffDate + 1}`;
        endDate = `${currentYear}-${currentMonth + 1}-${cutOffDate}`;
    }
    else {
        startDate = `${currentYear}-${currentMonth - 1}-${cutOffDate + 1}`;
        endDate = `${currentYear}-${currentMonth}-${cutOffDate}`;
    }
    return [startDate, endDate];
};
exports.getPurchaseRange = getPurchaseRange;
//# sourceMappingURL=credit-cards.utils.js.map