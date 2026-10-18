import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DocumentItemDto } from './dto/document.dto';

@Injectable()
export class DocumentCalculationService {
  calculate(items: DocumentItemDto[]) {
    const round = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const rows = items.map((item, position) => {
      const quantity = new Prisma.Decimal(item.quantity), unitPrice = new Prisma.Decimal(item.unitPrice);
      const discountAmount = new Prisma.Decimal(item.discountAmount), taxPercent = new Prisma.Decimal(item.taxPercent);
      const grossAmount = round(quantity.mul(unitPrice));
      if (!quantity.gt(0) || unitPrice.lt(0) || discountAmount.lt(0) || discountAmount.gt(grossAmount) || taxPercent.lt(0) || taxPercent.gt(100)) throw new BadRequestException('Check item quantity, price, discount and tax rate.');
      const netAmount = grossAmount.minus(discountAmount), taxAmount = round(netAmount.mul(taxPercent).div(100)), totalAmount = netAmount.plus(taxAmount);
      for (const amount of [grossAmount, netAmount, taxAmount, totalAmount]) if (amount.gte('100000000000000')) throw new BadRequestException('Document amount is too large.');
      return { position, description: item.description.trim(), unit: item.unit ?? null, quantity, unitPrice, discountAmount, taxPercent, grossAmount, netAmount, taxAmount, totalAmount };
    });
    const sum = (key: 'grossAmount' | 'discountAmount' | 'taxAmount' | 'totalAmount') => rows.reduce((s, r) => s.plus(r[key]), new Prisma.Decimal(0));
    const totals = { subtotal: sum('grossAmount'), discountTotal: sum('discountAmount'), taxTotal: sum('taxAmount'), grandTotal: sum('totalAmount') };
    if (Object.values(totals).some(a => a.gte('100000000000000'))) throw new BadRequestException('Document total is too large.');
    return { rows, totals };
  }
}
