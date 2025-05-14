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
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MyUser } from 'types/user.interface';

interface UserProps {
  user: MyUser;
  onSave: (user: MyUser) => void;
  onSendMessage: (user: MyUser) => void;
}

export function User({ user, onSave, onSendMessage }: UserProps) {
  const router = useRouter();
  return (
    <TableRow>
      <TableCell>{user.id}</TableCell>
      <TableCell>{user.telegramUsername}</TableCell>
      <TableCell>{user.telegramId}</TableCell>
      <TableCell>{normalDateFromSting(user.createdAt.split('T')[0])}</TableCell>
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
            <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/more-info`)}>
              Подробнее
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Редактировать')}>
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendMessage(user)}>
              Написать сообщение
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
