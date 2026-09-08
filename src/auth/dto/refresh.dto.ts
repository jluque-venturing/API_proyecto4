import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description:
      'El refreshToken que devolvio /auth/login o /auth/register. No mandes el accessToken aca.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMTZhIn0.firma',
  })
  @IsJWT()
  refreshToken: string;
}
