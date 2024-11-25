import { PrismaService } from '@/prisma.service'

const prisma = new PrismaService()

export const getLoanDetails = async (userEmail: string) => {

  // Primero obtenemos todos los IDs de préstamos
  const loanIds = await prisma.loans.findMany({
    where: {
      user_email: userEmail
    },
    select: {
      id: true
    }
  })

  // Obtenemos los totales para todos los préstamos en una sola consulta
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
  })

  // Creamos un Map para acceso rápido a los totales
  const totalsMap = new Map(
    totalPayments.map(total => [
      total.loan_id,
      total._sum.payment_amount || 0
    ])
  )

  // Obtenemos los detalles completos
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
  })

  // Combinamos toda la información
  return loans.map(loan => ({
    ...loan,
    last_five_payments: loan.payments,
    total_payments: totalsMap.get(loan.id) || 0
  }))
}
