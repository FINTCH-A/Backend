import { Module }                    from '@nestjs/common';
import { RiskAssessmentController }  from './risk-assessment.controller';
import { RiskAssessmentService }     from './risk-assessment.service';
import { RiskAssessmentRepository }  from './risk-assessment.repository';

@Module({
  controllers: [RiskAssessmentController],
  providers:   [RiskAssessmentService, RiskAssessmentRepository],
  exports:     [RiskAssessmentService, RiskAssessmentRepository],
})
export class RiskAssessmentModule {}
