export interface newExpense {
  amount: number
  category: string
  date: string
  description: string
  fullName?: string
  email: string
}

export interface monthlyExpense {
  email: string
  month: string
  year: string
}

export interface yearlyExpense {
  email: string
  year: string
}

export interface newGoal {
  email: string
  endDate: string
  name: string
  fullName?: string
  startDate: string
  targetAmount: number
  currentAmount: number
}

export interface singleGoal {
  id: number
  email: string
}

export interface updatedGoal {
  newCurrentAmount: number
  newEndDate: string
  newSavingName: string
  newTarget: number
  email: string
  id: number
}

export interface newIncome {
  amount: number
  category: string
  date: string
  description: string
  fullName?: string
  email: string
}

export interface monthlyEntry {
  email: string
  month: string
  year: string
}

export interface yearlyEntry {
  email: string
  year: string
}

export interface newReminder {
  description: string
  email: string
  fullName?: string
  reminderDate: string
  title: string
}

export interface singleReminder {
  email: string
  id: number
}

export interface updatedReminder {
  email: string
  id: number
  newDescription: string
  newDate: string
  newTitle: string
}
