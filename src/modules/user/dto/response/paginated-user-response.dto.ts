import { ApiProperty }      from '@nestjs/swagger';
import { UserResponseDto }  from './user-response.dto';
import { PaginationMeta }   from '../../../../common/utils/pagination.util';

export class PaginatedUserResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty()
  meta: PaginationMeta;
}
