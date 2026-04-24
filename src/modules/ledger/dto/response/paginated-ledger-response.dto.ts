import { ApiProperty }          from '@nestjs/swagger';
import { LedgerEntryResponseDto } from './ledger-entry-response.dto';
import { PaginationMeta }         from '../../../../common/utils/pagination.util';

export class PaginatedLedgerResponseDto {
  @ApiProperty({ type: [LedgerEntryResponseDto] })
  data: LedgerEntryResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
