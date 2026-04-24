import { ApiProperty }    from '@nestjs/swagger';
import { LoanResponseDto } from './loan-response.dto';
import { PaginationMeta }  from '../../../../common/utils/pagination.util';

export class PaginatedLoanResponseDto {
  @ApiProperty({ type: [LoanResponseDto] })
  data: LoanResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
