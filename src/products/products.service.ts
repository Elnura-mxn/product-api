import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import * as ExcelJS from 'exceljs';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(search?: string) {
    return this.productRepository.find({
      where: search ? { name: ILike(`%${search}%`) } : {},
      relations: { category: true },
    });
  }

  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: number) {
    const product = await this.findOne(id);
    return this.productRepository.softRemove(product);
  }

  async updateImage(id: number, filename: string) {
    const product = await this.findOne(id);
    product.image = `/static/${filename}`;
    return this.productRepository.save(product);
  }

  async exportToExcel() {
    const products = await this.productRepository.find({
      relations: { category: true },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Products');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Название', key: 'name', width: 30 },
      { header: 'Описание', key: 'description', width: 50 },
      { header: 'Цена', key: 'price', width: 15 },
      { header: 'ID категории', key: 'categoryId', width: 15 },
      { header: 'Категория', key: 'category', width: 30 },
      { header: 'Изображение', key: 'image', width: 50 },
    ];

    products.forEach((product) => {
      worksheet.addRow({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        category: product.category?.name,
        image: product.image,
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  @Transactional()
  async createMany(createProductDtos: CreateProductDto[]) {
    const result: Product[] = [];
    for (const createProductDto of createProductDtos) {
      const product = this.productRepository.create(createProductDto);
      const savedProduct = await this.productRepository.save(product);
      result.push(savedProduct);
    }
    return result;
  }
}
