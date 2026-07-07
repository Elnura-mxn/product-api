import {
  IsDateString,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../entities/order.entity';
import { CreateOrderDetailDto } from './create-order-detail.dto';

export class CreateOrderDto {
  @ApiProperty({ example: '2026-07-07', description: 'Дата заказа' })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 10,
    description: 'Скидка на заказ',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiProperty({ example: 'Эльнура Ертай', description: 'Имя покупателя' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    description: 'Статус заказа',
    required: false,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({
    type: [CreateOrderDetailDto],
    description: 'Позиции заказа (товары и количество)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  orderDetails: CreateOrderDetailDto[];
}