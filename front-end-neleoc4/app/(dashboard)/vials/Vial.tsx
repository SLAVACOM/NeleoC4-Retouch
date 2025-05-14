import { Button } from '@/components/ui/button';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import { DropdownMenu } from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface VialProps {
  vial: Vial;
  onOpen: (vial: Vial) => void;
}

export function Vial({ vial, onOpen }: VialProps) {
  return (
    <TableRow>
      <TableCell>{vial.id}</TableCell>
      <TableCell>{vial.name}</TableCell>
      <TableCell>
        <img src={vial.photoUrl} alt={vial.name} className="w-8 h-8" />
      </TableCell>
      <TableCell> {new Date(vial.createdAt).toLocaleDateString()}</TableCell>
      <TableCell> {new Date(vial.updatedAt).toLocaleDateString()}</TableCell>
      <TableCell>{vial.isDelete ? 'Да' : 'Нет'}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onOpen(vial)}>
              Edit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
