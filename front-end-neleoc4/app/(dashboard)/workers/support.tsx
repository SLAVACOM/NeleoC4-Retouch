'use client';

import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { IHelperWorker } from 'types/workers.interface';

interface WorkerProps {
  support: IHelperWorker;
  onSave: (updatedWorker: IHelperWorker) => void;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const Support: React.FC<WorkerProps> = ({ support, onSave }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (updatedSupport: IHelperWorker) => {
    onSave(updatedSupport);
    setIsEditModalOpen(false);
  };
  
  return (
    <>
      <TableRow>
        <TableCell>{support.id}</TableCell>
        <TableCell>
          {support.info ? truncateText(support.info, 20) : 'Не указано'}
        </TableCell>

        <TableCell>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            Редактировать
          </Button>
        </TableCell>

        <TableCell>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsEditModalOpen(true)}
          >
            Удалить
          </Button>
        </TableCell>
      </TableRow>
    </>
  );
};
