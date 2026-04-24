import { ApiProperty }           from '@nestjs/swagger';
import { InstallmentResponseDto } from './installment-response.dto';
import { PaginationMeta }         from '../../../../common/utils/pagination.util';

export class PaginatedInstallmentResponseDto {
  @ApiProperty({ type: [InstallmentResponseDto] })
  data: InstallmentResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
