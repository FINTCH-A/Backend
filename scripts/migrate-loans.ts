// scripts/migrate-loans.ts
import { PrismaClient, ApplicationStatus, LoanStatus, InterestType, AmortizationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración de préstamos...\n');

  // Buscar solicitudes aprobadas sin préstamo usando Prisma Client
  const applications = await prisma.loanApplication.findMany({
    where: {
      status: ApplicationStatus.APPROVED,
      loan: null, // No tiene préstamo asociado
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`📊 Encontradas ${applications.length} solicitudes aprobadas sin préstamo\n`);

  if (applications.length === 0) {
    console.log('✅ No hay solicitudes pendientes de migrar.');
    return;
  }

  // Mostrar las solicitudes encontradas
  applications.forEach((app) => {
    console.log(`  - Solicitud #${app.id}: Usuario ${app.user.email}, Monto: ${app.requestedAmount}, Plazo: ${app.requestedTerm} meses`);
  });

  console.log('\n');

  let created = 0;
  let errors = 0;

  for (const app of applications) {
    try {
      // Generar código único para el préstamo
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, '0');

      const loanCount = await prisma.loan.count();
      const seq = String(loanCount + created + 1).padStart(6, '0');
      const loanCode = `AV${year}${month}-${seq}`;

      // Calcular totalAmount (monto + interés simple 15%)
      const totalAmount = Number(app.requestedAmount) * 1.15;

      // Crear el préstamo usando Prisma Client
      const newLoan = await prisma.loan.create({
        data: {
          loanCode: loanCode,
          requestedAmount: app.requestedAmount,
          approvedAmount: app.requestedAmount,
          interestRate: 0.15,
          interestType: InterestType.FIXED,
          amortization: AmortizationType.FRENCH,
          totalAmount: totalAmount,
          termMonths: app.requestedTerm,
          currency: 'PEN',
          status: LoanStatus.APPROVED,
          approvedBy: app.reviewedBy,
          userId: app.userId,
          loanApplicationId: app.id,
        },
      });

      console.log(`✅ Préstamo creado: ${newLoan.loanCode} (ID: ${newLoan.id}) para solicitud #${app.id}`);
      created++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error al crear préstamo para solicitud #${app.id}: ${errorMessage}`);
      errors++;
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   ✅ Préstamos creados: ${created}`);
  console.log(`   ❌ Errores: ${errors}`);

  if (created > 0) {
    console.log(`\n💡 Ahora los usuarios podrán ver sus préstamos en el dashboard.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
