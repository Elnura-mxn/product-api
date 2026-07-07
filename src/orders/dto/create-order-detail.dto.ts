import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDetailDto {
  @ApiProperty({ example: 1, description: 'ID продукта' })
  @IsNumber()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 2, description: 'Количество товара' })
  @IsNumber()
  @IsPositive()
  quantity: number;
}