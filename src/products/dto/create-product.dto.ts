import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 13', description: 'Название продукта' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Телефон Apple с экраном 6.1 дюйма',
    description: 'Описание продукта',
    required: false,
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ example: 500000, description: 'Цена продукта' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 1, description: 'ID категории продукта' })
  @IsNumber()
  categoryId: number;
}
