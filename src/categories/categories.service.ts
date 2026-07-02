import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { ILike, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(search?: string) {
    return this.categoryRepository.find({
      where: search ? { name: ILike(`%${search}%`) } : {},
    });
  }

  async findOne(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return this.categoryRepository.softRemove(category);
  }

  async exportToExcel() {
    const categories = await this.categoryRepository.find();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Categories');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Название', key: 'name', width: 30 },
      { header: 'Описание', key: 'description', width: 50 },
      { header: 'Дата создания', key: 'createdAt', width: 30 },
      { header: 'Дата обновления', key: 'updatedAt', width: 30 },
    ];

    categories.forEach((category) => {
      worksheet.addRow({
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}
