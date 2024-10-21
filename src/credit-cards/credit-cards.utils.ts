export const getPurchaseRange = (cutOffDate: number, paymentDueDate: number) => {
  const dueDate = new Date(paymentDueDate)
  const currentMonth = dueDate.getMonth() + 1
  const currentYear = dueDate.getFullYear()
  const currentDay = dueDate.getDate()

  let startDate: string
  let endDate: string

  if (currentDay > cutOffDate) {
    startDate = `${currentYear}-${currentMonth}-${cutOffDate + 1}`
    endDate = `${currentYear}-${currentMonth + 1}-${cutOffDate}`
  } else {
    startDate = `${currentYear}-${currentMonth - 1}-${cutOffDate + 1}`
    endDate = `${currentYear}-${currentMonth}-${cutOffDate}`
  }

  return [ startDate, endDate ]
}
