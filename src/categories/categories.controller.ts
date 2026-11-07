import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { category_type, users } from "@prisma/client";
import { CreateCategoryDto, UpdateCategoryDto } from "./categories.dto";
import { CategoriesService } from "./categories.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(@CurrentUser() user: users, @Query("type") type?: category_type) {
    return this.categoriesService.getCategories(user.id, type);
  }

  @Post()
  async createCategory(@CurrentUser() user: users, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(user.id, dto);
  }

  @Patch(":id")
  async updateCategory(
    @CurrentUser() user: users,
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(user.id, id, dto);
  }

  @Delete(":id")
  async deleteCategory(@CurrentUser() user: users, @Param("id") id: string) {
    return this.categoriesService.deleteCategory(user.id, id);
  }
}
