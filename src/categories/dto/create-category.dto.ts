import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Электроника', description: 'Название категории' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Телефоны и гаджеты',
    description: 'Описание',
    required: false,
  })
  @IsString()
  @IsOptional()
  description: string;
}
