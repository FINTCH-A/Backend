import { ApiProperty }      from '@nestjs/swagger';
import { PaymentResponseDto } from './payment-response.dto';
import { PaginationMeta }   from '../../../../common/utils/pagination.util';

export class PaginatedPaymentResponseDto {
  @ApiProperty({ type: [PaymentResponseDto] })
  data: PaymentResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
