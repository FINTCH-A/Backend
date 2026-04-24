import { Module } from '@nestjs/common';
import { LoanApplicationService } from './loan-application.service';
import { LoanApplicationController } from './loan-application.controller';
import { LoanApplicationRepository } from './loan-application.repository';
import { LoanModule } from '../loan/loan.module';
import { NotificationModule } from '../notification/notification.module'; // ← AGREGAR

@Module({
  imports: [LoanModule, NotificationModule], // ← AGREGAR NotificationModule
  controllers: [LoanApplicationController],
  providers: [LoanApplicationService, LoanApplicationRepository],
  exports: [LoanApplicationService],
})
export class LoanApplicationModule {}
