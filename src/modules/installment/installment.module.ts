import { Module }                 from '@nestjs/common';
import { InstallmentController }  from './installment.controller';
import { InstallmentService }     from './installment.service';
import { InstallmentRepository }  from './installment.repository';

@Module({
  controllers: [InstallmentController],
  providers:   [InstallmentService, InstallmentRepository],
  exports:     [InstallmentService, InstallmentRepository],
})
export class InstallmentModule {}
