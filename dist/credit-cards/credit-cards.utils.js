"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPurchaseRange = void 0;
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const getPurchaseRange = (cutOffDate) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let startDate;
    let endDate;
    if (today.getDate() > cutOffDate) {
        startDate = new Date(currentYear, currentMonth - 1, cutOffDate + 1);
        endDate = new Date(currentYear, currentMonth, cutOffDate);
    }
    else {
        startDate = new Date(currentYear, currentMonth - 2, cutOffDate + 1);
        endDate = new Date(currentYear, currentMonth - 1, cutOffDate);
    }
    return [formatDate(startDate), formatDate(endDate)];
};
exports.getPurchaseRange = getPurchaseRange;
//# sourceMappingURL=credit-cards.utils.js.map