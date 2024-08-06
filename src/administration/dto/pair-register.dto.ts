import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUppercase } from 'class-validator';

export class PairRegisterDto {
    @ApiProperty({ description: 'Base instrument in uppercase like USD' })
    @IsString() 
    @IsUppercase()
    base: string;
}
