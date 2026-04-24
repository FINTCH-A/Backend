import { Module }               from '@nestjs/common';
import { FamilyInfoController } from './family-info.controller';
import { FamilyInfoService }    from './family-info.service';
import { FamilyInfoRepository } from './family-info.repository';

@Module({
  controllers: [FamilyInfoController],
  providers:   [FamilyInfoService, FamilyInfoRepository],
  exports:     [FamilyInfoService, FamilyInfoRepository],
})
export class FamilyInfoModule {}
