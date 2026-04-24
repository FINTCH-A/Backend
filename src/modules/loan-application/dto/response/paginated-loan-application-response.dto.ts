import { ApiProperty }                   from '@nestjs/swagger';
import { LoanApplicationResponseDto }    from './loan-application-response.dto';
import { PaginationMeta }                from '../../../../common/utils/pagination.util';

export class PaginatedLoanApplicationResponseDto {
  @ApiProperty({ type: [LoanApplicationResponseDto] })
  data: LoanApplicationResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
