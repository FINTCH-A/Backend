import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// ─── Infraestructura ──────────────────────────────────────────
import { PrismaModule }        from './database/prisma/prisma.module';
import { AuthModule }          from './modules/auth/auth.module';

// ─── Módulos de negocio ───────────────────────────────────────
import { UserModule }           from './modules/user/user.module';
import { AddressModule }        from './modules/address/address.module';
import { KycModule }            from './modules/kyc/kyc.module';
import { FinancialInfoModule }  from './modules/financial-info/financial-info.module';
import { FamilyInfoModule }     from './modules/family-info/family-info.module';
import { PaymentMethodModule }  from './modules/payment-method/payment-method.module';
import { LoanApplicationModule }from './modules/loan-application/loan-application.module';
import { LoanModule }           from './modules/loan/loan.module';
import { InstallmentModule }    from './modules/installment/installment.module';
import { PaymentModule }        from './modules/payment/payment.module';
import { TransactionModule }    from './modules/transaction/transaction.module';
import { CreditScoreModule }    from './modules/credit-score/credit-score.module';
import { RiskAssessmentModule } from './modules/risk-assessment/risk-assessment.module';
import { LedgerModule }         from './modules/ledger/ledger.module';
import { NotificationModule }   from './modules/notification/notification.module';
import { WebhookModule }        from './modules/webhook/webhook.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

// ─── Common ───────────────────────────────────────────────────
import { JwtAuthGuard }        from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({
      isGlobal:   true,
      envFilePath: '.env',
    }),

    // Base de datos
    PrismaModule,

    // Auth
    AuthModule,

    // // Negocio
    UserModule,
    AddressModule,
    KycModule,
    FinancialInfoModule,
    FamilyInfoModule,
    PaymentMethodModule,
    LoanApplicationModule,
    LoanModule,
    InstallmentModule,
    PaymentModule,
    TransactionModule,
    CreditScoreModule,
    RiskAssessmentModule,
    LedgerModule,
    NotificationModule,
    WebhookModule,
    DashboardModule,
  ],
  providers: [
    // Guard JWT aplicado globalmente
    {
      provide:  APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Filter global
    {
      provide:  APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Interceptor global de respuesta
    {
      provide:  APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
