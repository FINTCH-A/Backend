import {
  PrismaClient,
  UserRole,
  UserStatus,
  MaritalStatus,
  HousingType,
  EmploymentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeds para AvanteCreditos...');

  // ─── LIMPIAR ─────────────────────────────────────────────────
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.externalTransaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.loanStatusHistory.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.requestLocation.deleteMany();
  await prisma.loanApplication.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.creditScore.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.kYC.deleteMany();
  await prisma.familyInfo.deleteMany();
  await prisma.financialInfo.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  console.log('🗑️  Base de datos limpiada');

  const rounds = 10;
  const pass   = await bcrypt.hash('Password123!', rounds);

  // ─── ADMIN ───────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      firstName:     'Carlos',
      lastName:      'Mendoza Rivera',
      dni:           '10000001',
      email:         'admin@avante.pe',
      phone:         '+51999000001',
      password:      pass,
      dateOfBirth:   new Date('1985-03-10'),
      role:          UserRole.ADMIN,
      status:        UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
      lastLogin:     new Date(),
    },
  });

  // ─── ANALISTA ────────────────────────────────────────────────
  const analyst = await prisma.user.create({
    data: {
      firstName:     'María',
      lastName:      'Torres Quispe',
      dni:           '10000002',
      email:         'analista@avante.pe',
      phone:         '+51999000002',
      password:      pass,
      dateOfBirth:   new Date('1990-07-22'),
      role:          UserRole.ANALYST,
      status:        UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // ─── CLIENTES ────────────────────────────────────────────────
  const clientesData = [
    {
      firstName: 'Juan',  lastName: 'Pérez García',
      dni: '20000001',    email: 'juan.perez@gmail.com',
      phone: '+51987000001', dateOfBirth: new Date('1992-05-15'),
    },
    {
      firstName: 'Ana',   lastName: 'Flores Huanca',
      dni: '20000002',    email: 'ana.flores@gmail.com',
      phone: '+51987000002', dateOfBirth: new Date('1988-11-30'),
    },
    {
      firstName: 'Pedro', lastName: 'Ríos Mamani',
      dni: '20000003',    email: 'pedro.rios@gmail.com',
      phone: '+51987000003', dateOfBirth: new Date('1995-02-08'),
    },
    {
      firstName: 'Rosa',  lastName: 'Ccopa Turpo',
      dni: '20000004',    email: 'rosa.ccopa@gmail.com',
      phone: '+51987000004', dateOfBirth: new Date('1987-09-19'),
    },
    {
      firstName: 'Luis',  lastName: 'Vargas Condori',
      dni: '20000005',    email: 'luis.vargas@gmail.com',
      phone: '+51987000005', dateOfBirth: new Date('1993-12-25'),
    },
  ];

  const clientes = await Promise.all(
    clientesData.map((c) =>
      prisma.user.create({
        data: {
          ...c,
          password:      pass,
          role:          UserRole.CUSTOMER,
          status:        UserStatus.ACTIVE,
          emailVerified: true,
          phoneVerified: true,
        },
      }),
    ),
  );

  console.log(`👥 Usuarios creados: 1 admin, 1 analista, ${clientes.length} clientes`);

  // ─── DIRECCIONES ─────────────────────────────────────────────
  await Promise.all(
    clientes.map((c, i) =>
      prisma.address.create({
        data: {
          userId:        c.id,
          country:       'Perú',
          department:    ['Junín', 'Lima', 'Cusco', 'Arequipa', 'Junín'][i],
          city:          ['Huancayo', 'Lima', 'Cusco', 'Arequipa', 'Huancayo'][i],
          district:      ['El Tambo', 'Miraflores', 'Wanchaq', 'Yanahuara', 'Chilca'][i],
          streetAddress: [
            'Av. Giráldez 245',
            'Jr. de la Unión 890',
            'Av. El Sol 1200',
            'Av. Ejército 567',
            'Pasaje Los Andes 34',
          ][i],
          postalCode: ['12001', '15001', '08001', '04001', '12002'][i],
        },
      }),
    ),
  );

  // ─── INFO FINANCIERA ─────────────────────────────────────────
  await Promise.all(
    clientes.map((c, i) =>
      prisma.financialInfo.create({
        data: {
          userId:             c.id,
          monthlyIncome:      [3500, 4800, 1800, 3200, 2500][i],
          monthlyExpenses:    [1500, 2000, 900,  1500, 1200][i],
          employmentStatus:   [
            EmploymentStatus.EMPLOYED,
            EmploymentStatus.SELF_EMPLOYED,
            EmploymentStatus.EMPLOYED,
            EmploymentStatus.EMPLOYED,
            EmploymentStatus.EMPLOYED,
          ][i],
          employerName:  [
            'Empresa Tecnológica SAC',
            'Negocio Propio',
            'Constructora Andina SAC',
            'Municipalidad de Arequipa',
            'Minera del Centro SAC',
          ][i],
          employerPhone:      ['+51999111001', null, '+51999111003', '+51999111004', '+51999111005'][i],
          numberOfDependents: [1, 2, 0, 3, 1][i],
          otherIncomeSources: [500, 1200, null, null, 300][i],
        },
      }),
    ),
  );

  // ─── INFO FAMILIAR ───────────────────────────────────────────
  await Promise.all(
    clientes.map((c, i) =>
      prisma.familyInfo.create({
        data: {
          userId:           c.id,
          maritalStatus:    [
            MaritalStatus.SINGLE,
            MaritalStatus.MARRIED,
            MaritalStatus.SINGLE,
            MaritalStatus.MARRIED,
            MaritalStatus.DIVORCED,
          ][i],
          numberOfChildren: [0, 2, 0, 3, 1][i],
          housingType:      [
            HousingType.RENTED,
            HousingType.OWNED,
            HousingType.FAMILY,
            HousingType.OWNED,
            HousingType.RENTED,
          ][i],
        },
      }),
    ),
  );

  console.log('📋 Perfiles creados (address, financial, family)');

  // ─── MÉTODOS DE PAGO ─────────────────────────────────────────
  const paymentMethods = await Promise.all(
    clientes.map((c, i) =>
      prisma.paymentMethod.create({
        data: {
          userId:        c.id,
          type:          'DIGITAL_WALLET',
          provider:      ['Yape', 'Plin', 'Yape', 'Plin', 'Yape'][i],
          accountNumber: `9${87000000 + c.id}`,
          accountHolder: `${c.firstName} ${c.lastName}`,
          isDefault:     true,
        },
      }),
    ),
  );

  console.log('💳 Métodos de pago creados');

  // ─── KYC ─────────────────────────────────────────────────────
  await Promise.all(
    clientes.map((c) =>
      prisma.kYC.create({
        data: {
          userId:        c.id,
          documentFront: `https://storage.avante.pe/kyc/${c.id}/front.jpg`,
          documentBack:  `https://storage.avante.pe/kyc/${c.id}/back.jpg`,
          selfie:        `https://storage.avante.pe/kyc/${c.id}/selfie.jpg`,
          verified:      true,
          verifiedAt:    new Date(),
        },
      }),
    ),
  );

  console.log('🪪  KYC verificado para todos los clientes');

  // ─── CREDIT SCORES ───────────────────────────────────────────
  await Promise.all(
    clientes.map((c, i) =>
      prisma.creditScore.create({
        data: {
          userId:         c.id,
          score:          [720, 680, 580, 710, 640][i],
          riskLevel:      ['LOW', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM'][i],
          paymentHistory: [0.95, 0.85, 0.70, 0.93, 0.80][i],
          debtRatio:      [0.25, 0.38, 0.55, 0.28, 0.42][i],
          maxLoanAmount:  [15000, 10000, 4000, 12000, 7000][i],
          notes:          [
            'Buen historial crediticio. Sin deudas pendientes.',
            'Negocio propio con ingresos variables. Perfil medio.',
            'Empleado nuevo. Historial corto.',
            'Excelente perfil. Ingresos estables en sector público.',
            'Deuda anterior cancelada. Perfil en recuperación.',
          ][i],
          evaluatedAt: new Date(),
          expiresAt:   new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      }),
    ),
  );

  console.log('📊 Credit scores creados');

  // ─── RISK ASSESSMENTS ────────────────────────────────────────
  await Promise.all(
    clientes.map((c, i) =>
      prisma.riskAssessment.create({
        data: {
          userId:    c.id,
          score:     [15.5, 32.0, 68.5, 12.0, 45.0][i],
          riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'LOW', 'MEDIUM'][i],
          reasons:   {
            multipleIPs:   false,
            blacklisted:   false,
            velocityFlag:  [false, true, true, false, false][i],
            deviceVerified: true,
          },
          ipAddress:  `190.41.${20 + i}.1`,
          deviceInfo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      }),
    ),
  );

  console.log('🛡️  Risk assessments creados');

  // ═══════════════════════════════════════════════════════════
  // CLIENTE 1 — JUAN PÉREZ — PRÉSTAMO ACTIVO (4 cuotas pagadas)
  // ═══════════════════════════════════════════════════════════

  const app1 = await prisma.loanApplication.create({
    data: {
      userId:          clientes[0].id,
      requestedAmount: 5000,
      requestedTerm:   12,
      purpose:         'Compra de laptop y equipos para trabajo remoto',
      status:          'APPROVED',
      analystNotes:    'Perfil crediticio excelente. Score 720. Ingresos estables. Aprobado monto completo.',
      reviewedAt:      new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      reviewedBy:      analyst.id,
      requestLocation: {
        create: {
          latitude:  -12.0432,
          longitude: -77.0282,
          ipAddress: '190.41.20.1',
          deviceInfo: 'Mozilla/5.0 Chrome/120',
        },
      },
    },
  });

  // Préstamo Juan — ACTIVE, 4 cuotas pagadas
  const rate1   = 0.18 / 12;
  const term1   = 12;
  const amount1 = 5000;
  const factor1 = Math.pow(1 + rate1, term1);
  const fee1    = (amount1 * (rate1 * factor1)) / (factor1 - 1);
  const total1  = Math.round(fee1 * term1 * 100) / 100;

  const disbursed1 = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

  const loan1 = await prisma.loan.create({
    data: {
      userId:            clientes[0].id,
      loanApplicationId: app1.id,
      loanCode:          'AV2501-000001',
      requestedAmount:   amount1,
      approvedAmount:    amount1,
      interestRate:      0.18,
      interestType:      'FIXED',
      amortization:      'FRENCH',
      totalAmount:       total1,
      termMonths:        term1,
      currency:          'PEN',
      status:            'ACTIVE',
      approvedBy:        analyst.id,
      disbursedAt:       disbursed1,
      dueDate:           new Date(disbursed1.getTime() + term1 * 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.loanStatusHistory.createMany({
    data: [
      { loanId: loan1.id, status: 'PENDING',  changedBy: null,        createdAt: new Date(disbursed1.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { loanId: loan1.id, status: 'APPROVED', changedBy: analyst.id,  createdAt: new Date(disbursed1.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { loanId: loan1.id, status: 'ACTIVE',   changedBy: analyst.id,  createdAt: disbursed1 },
    ],
  });

  // Cuotas loan1 — 4 PAID, 8 PENDING
  let balance1   = amount1;
  const cuotas1  = [];
  for (let i = 1; i <= term1; i++) {
    const interest  = Math.round(balance1 * rate1 * 100) / 100;
    const principal = Math.round((fee1 - interest) * 100) / 100;
    const due       = new Date(disbursed1);
    due.setMonth(due.getMonth() + i);

    const isPaid    = i <= 4;
    const isOverdue = !isPaid && due < new Date();

    cuotas1.push({
      loanId:            loan1.id,
      installmentNumber: i,
      principalAmount:   principal,
      interestAmount:    interest,
      totalAmount:       Math.round(fee1 * 100) / 100,
      paidAmount:        isPaid ? Math.round(fee1 * 100) / 100 : 0,
      currency:          'PEN',
      dueDate:           due,
      paidAt:            isPaid ? new Date(disbursed1.getTime() + (i - 1) * 30 * 24 * 60 * 60 * 1000) : null,
      status:            isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING',
      daysOverdue:       isOverdue ? Math.floor((Date.now() - due.getTime()) / (1000 * 60 * 60 * 24)) : 0,
    });
    balance1 -= principal;
  }

  await prisma.installment.createMany({ data: cuotas1 });

  const installments1 = await prisma.installment.findMany({
    where:   { loanId: loan1.id },
    orderBy: { installmentNumber: 'asc' },
  });

  // Ledger — desembolso loan1
  await prisma.ledgerEntry.create({
    data: {
      userId:    clientes[0].id,
      loanId:    loan1.id,
      type:      'DISBURSEMENT',
      amount:    amount1,
      currency:  'PEN',
      reference: loan1.loanCode,
      createdAt: disbursed1,
    },
  });

  // Pagos de las 4 cuotas
  for (let i = 0; i < 4; i++) {
    const inst      = installments1[i];
    const payDate   = new Date(disbursed1.getTime() + i * 30 * 24 * 60 * 60 * 1000);
    const ref       = `PAY-J${String(i + 1).padStart(3, '0')}-${Date.now() + i}`;

    const payment = await prisma.payment.create({
      data: {
        userId:          clientes[0].id,
        loanId:          loan1.id,
        installmentId:   inst.id,
        paymentMethodId: paymentMethods[0].id,
        amount:          Number(inst.totalAmount),
        currency:        'PEN',
        status:          'COMPLETED',
        reference:       ref,
        paymentDate:     payDate,
        notes:           `Pago cuota #${i + 1} vía Yape`,
        createdAt:       payDate,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        userId:    clientes[0].id,
        loanId:    loan1.id,
        paymentId: payment.id,
        type:      'REPAYMENT',
        amount:    Number(inst.totalAmount),
        currency:  'PEN',
        reference: ref,
        createdAt: payDate,
      },
    });

    await prisma.externalTransaction.create({
      data: {
        paymentId:  payment.id,
        provider:   'YAPE',
        externalId: `YAPE-${100000 + i}`,
        status:     'COMPLETED',
        response:   { code: '00', message: 'Aprobado', transactionId: `YAPE-${100000 + i}` },
      },
    });
  }

  console.log('✅ Préstamo Juan Pérez creado (4 cuotas pagadas)');

  // ═══════════════════════════════════════════════════════════
  // CLIENTE 2 — ANA FLORES — PRÉSTAMO PAGADO COMPLETAMENTE
  // ═══════════════════════════════════════════════════════════

  const app2 = await prisma.loanApplication.create({
    data: {
      userId:          clientes[1].id,
      requestedAmount: 3000,
      requestedTerm:   6,
      purpose:         'Capital de trabajo para negocio de pastelería',
      status:          'APPROVED',
      analystNotes:    'Negocio consolidado. Ingresos variables pero suficientes. Aprobado.',
      reviewedAt:      new Date(Date.now() - 220 * 24 * 60 * 60 * 1000),
      reviewedBy:      analyst.id,
      requestLocation: {
        create: {
          latitude:  -12.1219,
          longitude: -77.0291,
          ipAddress: '190.41.21.1',
          deviceInfo: 'Mozilla/5.0 Safari/17',
        },
      },
    },
  });

  const rate2   = 0.18 / 12;
  const term2   = 6;
  const amount2 = 3000;
  const factor2 = Math.pow(1 + rate2, term2);
  const fee2    = (amount2 * (rate2 * factor2)) / (factor2 - 1);
  const total2  = Math.round(fee2 * term2 * 100) / 100;

  const disbursed2 = new Date(Date.now() - 210 * 24 * 60 * 60 * 1000);

  const loan2 = await prisma.loan.create({
    data: {
      userId:            clientes[1].id,
      loanApplicationId: app2.id,
      loanCode:          'AV2501-000002',
      requestedAmount:   amount2,
      approvedAmount:    amount2,
      interestRate:      0.18,
      interestType:      'FIXED',
      amortization:      'FRENCH',
      totalAmount:       total2,
      termMonths:        term2,
      currency:          'PEN',
      status:            'PAID',
      approvedBy:        analyst.id,
      disbursedAt:       disbursed2,
      dueDate:           new Date(disbursed2.getTime() + term2 * 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.loanStatusHistory.createMany({
    data: [
      { loanId: loan2.id, status: 'PENDING',  changedBy: null,       createdAt: new Date(disbursed2.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { loanId: loan2.id, status: 'APPROVED', changedBy: analyst.id, createdAt: new Date(disbursed2.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { loanId: loan2.id, status: 'ACTIVE',   changedBy: analyst.id, createdAt: disbursed2 },
      { loanId: loan2.id, status: 'PAID',     changedBy: analyst.id, createdAt: new Date(disbursed2.getTime() + term2 * 30 * 24 * 60 * 60 * 1000) },
    ],
  });

  // Cuotas loan2 — todas PAID
  let balance2  = amount2;
  const cuotas2 = [];
  for (let i = 1; i <= term2; i++) {
    const interest  = Math.round(balance2 * rate2 * 100) / 100;
    const principal = Math.round((fee2 - interest) * 100) / 100;
    const due       = new Date(disbursed2);
    due.setMonth(due.getMonth() + i);
    const paidAt    = new Date(due.getTime() - 2 * 24 * 60 * 60 * 1000);

    cuotas2.push({
      loanId:            loan2.id,
      installmentNumber: i,
      principalAmount:   principal,
      interestAmount:    interest,
      totalAmount:       Math.round(fee2 * 100) / 100,
      paidAmount:        Math.round(fee2 * 100) / 100,
      currency:          'PEN',
      dueDate:           due,
      paidAt,
      status:            'PAID',
      daysOverdue:       0,
    });
    balance2 -= principal;
  }

  await prisma.installment.createMany({ data: cuotas2 });

  const installments2 = await prisma.installment.findMany({
    where:   { loanId: loan2.id },
    orderBy: { installmentNumber: 'asc' },
  });

  // Ledger desembolso loan2
  await prisma.ledgerEntry.create({
    data: {
      userId:    clientes[1].id,
      loanId:    loan2.id,
      type:      'DISBURSEMENT',
      amount:    amount2,
      currency:  'PEN',
      reference: loan2.loanCode,
      createdAt: disbursed2,
    },
  });

  // Pagos de todas las cuotas
  for (let i = 0; i < term2; i++) {
    const inst    = installments2[i];
    const payDate = new Date(disbursed2.getTime() + i * 30 * 24 * 60 * 60 * 1000);
    const ref     = `PAY-A${String(i + 1).padStart(3, '0')}-${Date.now() + i}`;

    const payment = await prisma.payment.create({
      data: {
        userId:          clientes[1].id,
        loanId:          loan2.id,
        installmentId:   inst.id,
        paymentMethodId: paymentMethods[1].id,
        amount:          Number(inst.totalAmount),
        currency:        'PEN',
        status:          'COMPLETED',
        reference:       ref,
        paymentDate:     payDate,
        notes:           `Pago cuota #${i + 1} vía Plin`,
        createdAt:       payDate,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        userId:    clientes[1].id,
        loanId:    loan2.id,
        paymentId: payment.id,
        type:      'REPAYMENT',
        amount:    Number(inst.totalAmount),
        currency:  'PEN',
        reference: ref,
        createdAt: payDate,
      },
    });

    await prisma.externalTransaction.create({
      data: {
        paymentId:  payment.id,
        provider:   'PLIN',
        externalId: `PLIN-${200000 + i}`,
        status:     'COMPLETED',
        response:   { code: '00', message: 'Aprobado', transactionId: `PLIN-${200000 + i}` },
      },
    });
  }

  console.log('✅ Préstamo Ana Flores creado (completamente pagado)');

  // ═══════════════════════════════════════════════════════════
  // CLIENTE 2 — ANA FLORES — SEGUNDO PRÉSTAMO ACTIVO
  // ═══════════════════════════════════════════════════════════

  const app2b = await prisma.loanApplication.create({
    data: {
      userId:          clientes[1].id,
      requestedAmount: 8000,
      requestedTerm:   18,
      purpose:         'Ampliación del negocio y compra de horno industrial',
      status:          'APPROVED',
      analystNotes:    'Excelente historial de pagos en préstamo anterior. Aprobado.',
      reviewedAt:      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      reviewedBy:      analyst.id,
    },
  });

  const rate2b   = 0.16 / 12;
  const term2b   = 18;
  const amount2b = 8000;
  const factor2b = Math.pow(1 + rate2b, term2b);
  const fee2b    = (amount2b * (rate2b * factor2b)) / (factor2b - 1);
  const total2b  = Math.round(fee2b * term2b * 100) / 100;

  const disbursed2b = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);

  const loan2b = await prisma.loan.create({
    data: {
      userId:            clientes[1].id,
      loanApplicationId: app2b.id,
      loanCode:          'AV2501-000003',
      requestedAmount:   amount2b,
      approvedAmount:    amount2b,
      interestRate:      0.16,
      interestType:      'FIXED',
      amortization:      'FRENCH',
      totalAmount:       total2b,
      termMonths:        term2b,
      currency:          'PEN',
      status:            'ACTIVE',
      approvedBy:        analyst.id,
      disbursedAt:       disbursed2b,
      dueDate:           new Date(disbursed2b.getTime() + term2b * 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.loanStatusHistory.createMany({
    data: [
      { loanId: loan2b.id, status: 'PENDING',  changedBy: null,       createdAt: new Date(disbursed2b.getTime() - 5 * 24 * 60 * 60 * 1000) },
      { loanId: loan2b.id, status: 'APPROVED', changedBy: analyst.id, createdAt: new Date(disbursed2b.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { loanId: loan2b.id, status: 'ACTIVE',   changedBy: analyst.id, createdAt: disbursed2b },
    ],
  });

  // Cuotas loan2b — 1 pagada
  let balance2b  = amount2b;
  const cuotas2b = [];
  for (let i = 1; i <= term2b; i++) {
    const interest  = Math.round(balance2b * rate2b * 100) / 100;
    const principal = Math.round((fee2b - interest) * 100) / 100;
    const due       = new Date(disbursed2b);
    due.setMonth(due.getMonth() + i);
    const isPaid    = i === 1;

    cuotas2b.push({
      loanId:            loan2b.id,
      installmentNumber: i,
      principalAmount:   principal,
      interestAmount:    interest,
      totalAmount:       Math.round(fee2b * 100) / 100,
      paidAmount:        isPaid ? Math.round(fee2b * 100) / 100 : 0,
      currency:          'PEN',
      dueDate:           due,
      paidAt:            isPaid ? new Date(disbursed2b.getTime() + 28 * 24 * 60 * 60 * 1000) : null,
      status:            isPaid ? 'PAID' : 'PENDING',
      daysOverdue:       0,
    });
    balance2b -= principal;
  }

  await prisma.installment.createMany({ data: cuotas2b });

  const installments2b = await prisma.installment.findMany({
    where:   { loanId: loan2b.id },
    orderBy: { installmentNumber: 'asc' },
  });

  await prisma.ledgerEntry.create({
    data: {
      userId:    clientes[1].id,
      loanId:    loan2b.id,
      type:      'DISBURSEMENT',
      amount:    amount2b,
      currency:  'PEN',
      reference: loan2b.loanCode,
      createdAt: disbursed2b,
    },
  });

  // Pago cuota 1
  const refB0  = `PAY-A2B001-${Date.now()}`;
  const payB0  = await prisma.payment.create({
    data: {
      userId:          clientes[1].id,
      loanId:          loan2b.id,
      installmentId:   installments2b[0].id,
      paymentMethodId: paymentMethods[1].id,
      amount:          Number(installments2b[0].totalAmount),
      currency:        'PEN',
      status:          'COMPLETED',
      reference:       refB0,
      paymentDate:     new Date(disbursed2b.getTime() + 28 * 24 * 60 * 60 * 1000),
      notes:           'Pago cuota #1 vía Plin',
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      userId:    clientes[1].id,
      loanId:    loan2b.id,
      paymentId: payB0.id,
      type:      'REPAYMENT',
      amount:    Number(installments2b[0].totalAmount),
      currency:  'PEN',
      reference: refB0,
    },
  });

  console.log('✅ Segundo préstamo Ana Flores creado (activo, 1 cuota pagada)');

  // ═══════════════════════════════════════════════════════════
  // CLIENTE 3 — PEDRO RÍOS — SOLICITUD EN REVISIÓN
  // ═══════════════════════════════════════════════════════════

  await prisma.loanApplication.create({
    data: {
      userId:          clientes[2].id,
      requestedAmount: 4000,
      requestedTerm:   12,
      purpose:         'Compra de materiales de construcción',
      status:          'UNDER_REVIEW',
      analystNotes:    'En evaluación. Verificando documentación.',
      reviewedAt:      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reviewedBy:      analyst.id,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // CLIENTE 4 — ROSA CCOPA — SOLICITUD APROBADA SIN PRÉSTAMO
  // ═══════════════════════════════════════════════════════════

  await prisma.loanApplication.create({
    data: {
      userId:          clientes[3].id,
      requestedAmount: 10000,
      requestedTerm:   24,
      purpose:         'Remodelación de local comercial',
      status:          'APPROVED',
      analystNotes:    'Perfil sólido. Ingresos en sector público estables. Aprobado.',
      reviewedAt:      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      reviewedBy:      analyst.id,
    },
  });

  // ═══════════════════════════════════════════════════════════
  // CLIENTE 5 — LUIS VARGAS — SOLICITUD DRAFT
  // ═══════════════════════════════════════════════════════════

  await prisma.loanApplication.create({
    data: {
      userId:          clientes[4].id,
      requestedAmount: 2000,
      requestedTerm:   6,
      purpose:         'Gastos médicos familiares',
      status:          'DRAFT',
    },
  });

  console.log('📄 Solicitudes adicionales creadas');

  // ─── NOTIFICACIONES ──────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      // Juan Pérez
      {
        userId:  clientes[0].id,
        type:    'LOAN_APPROVED',
        title:   '✅ Préstamo Aprobado',
        message: `Tu préstamo por S/ 5,000 fue aprobado. Código: ${loan1.loanCode}`,
        isRead:  true,
        readAt:  new Date(Date.now() - 119 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
      {
        userId:  clientes[0].id,
        type:    'PAYMENT_RECEIVED',
        title:   '💚 Pago Recibido',
        message: 'Recibimos tu cuota #4. ¡Gracias por pagar a tiempo!',
        isRead:  true,
        readAt:  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId:  clientes[0].id,
        type:    'PAYMENT_DUE',
        title:   '⏰ Cuota por Vencer',
        message: 'Tu cuota #5 vence en 5 días. Monto: S/ 460.41',
        isRead:  false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },

      // Ana Flores
      {
        userId:  clientes[1].id,
        type:    'LOAN_APPROVED',
        title:   '✅ Primer Préstamo Aprobado',
        message: `Tu préstamo por S/ 3,000 fue aprobado. Código: ${loan2.loanCode}`,
        isRead:  true,
        readAt:  new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000),
      },
      {
        userId:  clientes[1].id,
        type:    'PAYMENT_RECEIVED',
        title:   '🎉 Préstamo Cancelado',
        message: `¡Felicitaciones! Terminaste de pagar tu préstamo ${loan2.loanCode}.`,
        isRead:  true,
        readAt:  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId:  clientes[1].id,
        type:    'LOAN_APPROVED',
        title:   '✅ Nuevo Préstamo Aprobado',
        message: `Tu préstamo por S/ 8,000 fue aprobado. Código: ${loan2b.loanCode}`,
        isRead:  false,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        userId:  clientes[1].id,
        type:    'PAYMENT_RECEIVED',
        title:   '💚 Pago Recibido',
        message: `Recibimos tu cuota #1 del préstamo ${loan2b.loanCode}. ¡Excelente!`,
        isRead:  false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },

      // Pedro Ríos
      {
        userId:  clientes[2].id,
        type:    'ACCOUNT_UPDATE',
        title:   '🔍 Solicitud en Revisión',
        message: 'Tu solicitud de S/ 4,000 está siendo evaluada por nuestro equipo.',
        isRead:  false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },

      // Rosa Ccopa
      {
        userId:  clientes[3].id,
        type:    'LOAN_APPROVED',
        title:   '✅ Solicitud Aprobada',
        message: 'Tu solicitud de S/ 10,000 fue aprobada. En breve recibirás el desembolso.',
        isRead:  false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('🔔 Notificaciones creadas');

  // ─── AUDIT LOGS ──────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      {
        userId:   admin.id,
        action:   'LOGIN',
        entity:   'User',
        entityId: admin.id,
        ipAddress: '190.41.1.1',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        userId:   analyst.id,
        action:   'LOAN_APPROVE',
        entity:   'LoanApplication',
        entityId: app1.id,
        ipAddress: '190.41.1.2',
        newValues: { status: 'APPROVED', analystId: analyst.id },
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        userId:   analyst.id,
        action:   'LOAN_APPROVE',
        entity:   'LoanApplication',
        entityId: app2.id,
        ipAddress: '190.41.1.2',
        newValues: { status: 'APPROVED', analystId: analyst.id },
        createdAt: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000),
      },
      {
        userId:   clientes[0].id,
        action:   'LOGIN',
        entity:   'User',
        entityId: clientes[0].id,
        ipAddress: '190.41.20.1',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        userId:   clientes[1].id,
        action:   'LOAN_APPLY',
        entity:   'LoanApplication',
        entityId: app2b.id,
        ipAddress: '190.41.21.1',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        userId:   clientes[1].id,
        action:   'PAYMENT_PROCESS',
        entity:   'Payment',
        entityId: payB0.id,
        ipAddress: '190.41.21.1',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('📝 Audit logs creados');

  // ─── WEBHOOKS ────────────────────────────────────────────────
  await prisma.webhookEvent.createMany({
    data: [
      {
        type:      'payment.completed',
        payload:   { reference: 'YAPE-100000', amount: 460.41, provider: 'YAPE' },
        processed: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        type:      'payment.completed',
        payload:   { reference: 'PLIN-200000', amount: 516.80, provider: 'PLIN' },
        processed: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        type:      'identity.verified',
        payload:   { userId: clientes[2].id, provider: 'RENIEC' },
        processed: false,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('🔗 Webhooks creados');

  // ─── RESUMEN ─────────────────────────────────────────────────
  console.log('\n✅ Seeds completados exitosamente');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Credenciales de acceso:');
  console.log('   Admin:    admin@avante.pe          / Password123!');
  console.log('   Analista: analista@avante.pe       / Password123!');
  console.log('   Cliente1: juan.perez@gmail.com     / Password123!  (préstamo activo)');
  console.log('   Cliente2: ana.flores@gmail.com     / Password123!  (2 préstamos)');
  console.log('   Cliente3: pedro.rios@gmail.com     / Password123!  (solicitud en revisión)');
  console.log('   Cliente4: rosa.ccopa@gmail.com     / Password123!  (solicitud aprobada)');
  console.log('   Cliente5: luis.vargas@gmail.com    / Password123!  (solicitud draft)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Datos creados:');
  console.log('   Préstamos:    3 (1 ACTIVE Juan, 1 PAID Ana, 1 ACTIVE Ana)');
  console.log('   Cuotas:       36 (12 + 6 + 18)');
  console.log('   Pagos:        11 (4 Juan + 6 Ana préstamo1 + 1 Ana préstamo2)');
  console.log('   Transacciones: 11 externas (Yape + Plin)');
  console.log('   Notificaciones: 9');
  console.log('   Audit logs:   6');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeds:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
