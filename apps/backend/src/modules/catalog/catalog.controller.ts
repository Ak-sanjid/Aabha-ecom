import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { type CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('categories')
  @ApiQuery({ name: 'system', required: false, enum: ['SIDE_PANEL', 'TOP_BAR'] })
  @ApiOperation({
    summary: 'Category tree for one of the two parallel category systems',
  })
  categories(@Query('system') system?: 'SIDE_PANEL' | 'TOP_BAR') {
    return this.catalog.listCategories(system);
  }

  @Public()
  @Get('brands')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiOperation({ summary: 'Paginated brand directory (also feeds the A–Z mega-menu)' })
  brands(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('featured') featured?: string,
  ) {
    return this.catalog.listBrands({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      featured: featured === 'true',
    });
  }

  @Public()
  @Get('brands/:slug')
  @ApiOperation({ summary: 'Single brand, including its style overrides' })
  brand(@Param('slug') slug: string) {
    return this.catalog.getBrand(slug);
  }
}
