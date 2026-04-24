import { Module }                    from '@nestjs/common';
import { FinancialInfoController }   from './financial-info.controller';
import { FinancialInfoService }      from './financial-info.service';
import { FinancialInfoRepository }   from './financial-info.repository';

@Module({
  controllers: [FinancialInfoController],
  providers:   [FinancialInfoService, FinancialInfoRepository],
  exports:     [FinancialInfoService, FinancialInfoRepository],
})
export class FinancialInfoModule {}
