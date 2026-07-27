import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Transactional } from 'typeorm-transactional';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    private readonly cls: ClsService,
  ) {}

  @Transactional()
  async create(createOrderDto: CreateOrderDto) {
    const currentUser = this.cls.get<JwtPayload>('user');

    const order = this.orderRepository.create({
      date: createOrderDto.date as unknown as Date,
      discount: createOrderDto.discount,
      customerName: createOrderDto.customerName,
      status: createOrderDto.status,
      managerId: currentUser?.sub,
      orderDetails: createOrderDto.orderDetails.map((detail) =>
        this.orderDetailRepository.create(detail),
      ),
    });
    return this.orderRepository.save(order);
  }

  async findAll() {
    return this.orderRepository.find({
      relations: { orderDetails: { product: true }, manager: true },
    });
  }

  async findOne(id: number) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: { orderDetails: { product: true }, manager: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);
    const { orderDetails, ...rest } = updateOrderDto;
    Object.assign(order, rest);

    if (orderDetails) {
      await this.orderDetailRepository.delete({ orderId: id });
      order.orderDetails = orderDetails.map((detail) =>
        this.orderDetailRepository.create({ ...detail, orderId: id }),
      );
    }

    return this.orderRepository.save(order);
  }

  async remove(id: number) {
    const order = await this.findOne(id);
    return this.orderRepository.softRemove(order);
  }
}