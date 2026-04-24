import { Module }                 from '@nestjs/common';
import { CreditScoreController }  from './credit-score.controller';
import { CreditScoreService }     from './credit-score.service';
import { CreditScoreRepository }  from './credit-score.repository';

@Module({
  controllers: [CreditScoreController],
  providers:   [CreditScoreService, CreditScoreRepository],
  exports:     [CreditScoreService, CreditScoreRepository],
})
export class CreditScoreModule {}
