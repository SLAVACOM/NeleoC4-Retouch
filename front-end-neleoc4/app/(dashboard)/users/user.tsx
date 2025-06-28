import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableCell, TableRow } from '@/components/ui/table';
import { normalDateFromSting } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UsersService } from 'services/users.service';
import { MyUser } from 'types/user.interface';

interface UserProps {
  user: MyUser;
  onSave: (user: MyUser) => void;
  onSendMessage: (user: MyUser) => void;
}

export function User({ user, onSave, onSendMessage }: UserProps) {
  const router = useRouter();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [freeGenerationCount, setFreeGenerationCount] = useState(
    user.freeGenerationCount
  );
  const [paymentGenerationCount, setPaymentGenerationCount] = useState(
    user.paymentGenerationCount
  );

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const updatedUser: MyUser = {
        ...user,
        freeGenerationCount,
        paymentGenerationCount
      };

      const res = await UsersService.updateUser(updatedUser);

      if (res.status === 200 || res.status === 201) {
        onSave(updatedUser);
        setIsEditDialogOpen(false);
      } else {
        alert('Ошибка при сохранении пользователя');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении пользователя');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => {
    setFreeGenerationCount(user.freeGenerationCount);
    setPaymentGenerationCount(user.paymentGenerationCount);
    setIsEditDialogOpen(true);
  };

  return (
    <TableRow>
      <TableCell>{user.id}</TableCell>
      <TableCell>{user.telegramUsername}</TableCell>
      <TableCell>{user.telegramId}</TableCell>
      <TableCell>{normalDateFromSting(user.createdAt.split('T')[0])}</TableCell>
      <TableCell>
        <>
          🆓: {user.freeGenerationCount} <br />
          💵: {user.paymentGenerationCount}
          <br />
          🟰: {user.paymentGenerationCount + user.freeGenerationCount}
        </>
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
            <DropdownMenuItem
              onClick={() => router.push(`/users/${user.id}/more-info`)}
            >
              Подробнее
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEditClick}>
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendMessage(user)}>
              Написать сообщение
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать пользователя</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="freeGenerations" className="text-right">
                  Бесплатные генерации
                </Label>
                <Input
                  id="freeGenerations"
                  type="number"
                  value={freeGenerationCount}
                  onChange={(e) =>
                    setFreeGenerationCount(Number(e.target.value))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentGenerations" className="text-right">
                  Платные генерации
                </Label>
                <Input
                  id="paymentGenerations"
                  type="number"
                  value={paymentGenerationCount}
                  onChange={(e) =>
                    setPaymentGenerationCount(Number(e.target.value))
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setIsLoading(false);
                }}
              >
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>{' '}
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}
