'use client';

import { EditPromoCodeModal } from '@/components/EditPromoCodeModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { normalDateFromSting } from '@/lib/utils';
import {} from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { IPromoCode } from 'types/promocodes.interface';

function getValue(promocode: IPromoCode): string {
  if (promocode.isAddGeneration) return `${promocode.generationCount} шт.`;
  if (promocode.discountPercentage > 0)
    return `${promocode.discountPercentage} %`;
  return `${promocode.discountSum} руб.`;
}

export function PromoCode({
  promoCode,
  onSave
}: {
  promoCode: IPromoCode;
  onSave: (updatedPromoCode: IPromoCode) => void;
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedPromoCode: IPromoCode) => {
    onSave(updatedPromoCode);
  };

  return (
    <>
      <TableRow>
        <TableCell>{promoCode.id}</TableCell>
        <TableCell>{promoCode.code}</TableCell>
        <TableCell>
          {promoCode.isAddGeneration ? 'Генерации' : 'Скидка'}{' '}
        </TableCell>
        <TableCell>{getValue(promoCode)}</TableCell>
        <TableCell>
          {normalDateFromSting(promoCode.expirationDate?.split('T')[0])}
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="capitalize">
            {promoCode.isActive ? 'Активен' : 'Не активен'}
          </Badge>
        </TableCell>

        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleEditClick}>
                Редактировать
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <EditPromoCodeModal
        promoCode={promoCode}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
