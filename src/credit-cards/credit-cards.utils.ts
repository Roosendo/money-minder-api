const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getPurchaseRange = (cutOffDate: number) => {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let startDate: Date
  let endDate: Date

  if (today.getDate() > cutOffDate) {
    startDate = new Date(currentYear, currentMonth - 1, cutOffDate + 1)
    endDate = new Date(currentYear, currentMonth, cutOffDate)
  } else {
    startDate = new Date(currentYear, currentMonth - 2, cutOffDate + 1)
    endDate = new Date(currentYear, currentMonth - 1, cutOffDate)
  }

  return [formatDate(startDate), formatDate(endDate)]
}
