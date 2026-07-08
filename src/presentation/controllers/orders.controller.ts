import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from '../../application/orders/orders.service';
import { CreateOrderDto } from '../../application/orders/dto/create-order.dto';
import { UpdateOrderDetailsDto } from '../../application/orders/dto/update-order-details.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { OrderFilters } from '../../domain/order/ports/order.repository.port';
import { OrderStatus } from '../../domain/order/value-objects/order-status.enum';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  async create(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(dto, user.id);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my orders' })
  async getMyOrders(@CurrentUser() user: any, @Query() filters: any) {
    return this.ordersService.findMyOrders(user.id, filters);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all orders (admin)' })
  async findAll(@Query() filters: OrderFilters) {
    return this.ordersService.findAll(filters);
  }

  @Post('migrate-pending-to-in-checkout')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Move pending orders with no payment gateway to IN_CHECKOUT (admin)',
  })
  async migratePendingToInCheckout() {
    return this.ordersService.migratePendingWithoutGatewayToInCheckout();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.findById(id, user);
  }

  @Patch(':id/details')
  @ApiOperation({ summary: 'Update order dedication details (owner, pending orders)' })
  async updateDetails(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDetailsDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateDetails(id, dto, user.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order status (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
