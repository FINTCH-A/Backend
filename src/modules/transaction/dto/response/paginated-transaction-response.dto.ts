import { ApiProperty }           from '@nestjs/swagger';
import { TransactionResponseDto } from './transaction-response.dto';
import { PaginationMeta }         from '../../../../common/utils/pagination.util';

export class PaginatedTransactionResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  data: TransactionResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
