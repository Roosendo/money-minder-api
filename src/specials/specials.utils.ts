import { PrismaService } from '@/prisma.service'

const prisma = new PrismaService()

export const getMonthlyBalance = async (year: string, userEmail: string) => {
  // First we get the incomes
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
  })

  // Then the expenses
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
  })

  // Now we create a map with the monthly balance
  const monthlyBalance = new Map()

  // Initialize with all months
  for (let i = 1; i <= 12; i++) {
    const month = i.toString().padStart(2, '0')
    monthlyBalance.set(month, { ingresos: 0, egresos: 0 })
  }

  // Add incomes
  incomes.forEach((income) => {
    const month = income.date.getMonth() + 1
    const monthStr = month.toString().padStart(2, '0')
    const current = monthlyBalance.get(monthStr)
    monthlyBalance.set(monthStr, {
      ...current,
      ingresos: income._sum.amount || 0,
    })
  })

  // Add expenses
  expenses.forEach((expense) => {
    const month = expense.date.getMonth() + 1
    const monthStr = month.toString().padStart(2, '0')
    const current = monthlyBalance.get(monthStr)
    monthlyBalance.set(monthStr, {
      ...current,
      egresos: expense._sum.amount || 0,
    })
  })

  // Return the result
  return Array.from(monthlyBalance.entries())
    .map(([month, values]) => ({
      month,
      total_ingresos: values.ingresos,
      total_egresos: values.egresos,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

export const getCategoryTotalsDetailed = async (year: string, userEmail: string) => {
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
  })

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
  })

  const categoryTotals = new Map();

  // Inicializar con todas las categorías encontradas
  [...incomes, ...expenses].forEach(item => {
    if (!categoryTotals.has(item.category)) {
      categoryTotals.set(item.category, {
        ingresos: 0,
        egresos: 0,
        total: 0
      })
    }
  })

  // Agregar ingresos
  incomes.forEach((income) => {
    const current = categoryTotals.get(income.category)
    const amount = income._sum.amount || 0
    categoryTotals.set(income.category, {
      ...current,
      ingresos: amount,
      total: current.total + amount
    })
  })

  // Agregar egresos
  expenses.forEach((expense) => {
    const current = categoryTotals.get(expense.category)
    const amount = expense._sum.amount || 0;
    categoryTotals.set(expense.category, {
      ...current,
      egresos: amount,
      total: current.total + amount
    })
  })

  return Array.from(categoryTotals.entries()).map(([category, values]) => ({
    category,
    ...values
  }))
}

export const getLatestTransactions = async (year: string, userEmail: string) => {
  // Obtener últimos 4 ingresos
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
  })

  // Obtener últimos 4 egresos
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
  })

  // Combinar y ordenar los resultados
  const allTransactions = [...latestEntries, ...latestExits]
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return allTransactions
}
