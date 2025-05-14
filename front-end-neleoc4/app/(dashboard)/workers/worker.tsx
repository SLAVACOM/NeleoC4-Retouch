'use client';

import { EditWorkerModal } from '@/components/EditWorkerModal';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { IWorker } from 'types/workers.interface';

interface WorkerProps {
  worker: IWorker;
  onSave: (updatedWorker: IWorker) => void;
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const Worker: React.FC<WorkerProps> = ({ worker, onSave }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <TableRow >
        <TableCell >{worker.id}</TableCell>
        <TableCell >
          {worker.name ? truncateText(worker.name, 10) : 'Не указано'}
        </TableCell>
        <TableCell >
          {worker.roles.length > 0 ? truncateText(worker.roles.join(', '), 15) : 'Не заданы'}
        </TableCell>
        <TableCell >
          {worker.isDelete ? 'Заблокирован' : 'Активен'}
        </TableCell>
        <TableCell >
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditModalOpen(true)}
          >
            Редактировать
          </Button>
        </TableCell>
      </TableRow>
      <EditWorkerModal
        worker={worker}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onSave}
      />
    </>
  );
};