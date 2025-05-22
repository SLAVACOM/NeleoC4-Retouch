'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { WorkersService } from 'services/workers.serevice';
import { IHelperWorker, IWorker } from 'types/workers.interface';

interface EditSupportModalProps {
  support: IHelperWorker;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSupport: IHelperWorker) => void;
}

export const EditSupportModal: React.FC<EditSupportModalProps> = ({
  support,
  isOpen,
  onClose,
  onSave
}) => {
  const [info, setInfo] = useState(support.info);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const updatedSupport = {
      ...support,
      info
    };
    try {
      let res;
      if (support.id === 0)
        res = await WorkersService.createHelper(updatedSupport);
      else res = await WorkersService.updateHelper(updatedSupport);

      if (res.status !== 200) throw new Error(res.data.message.join(', '));

      onSave(res.data);
      onClose();
    } catch (error: any) {
      const errorMessage = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error.message || 'Ошибка при сохранении работника.';
      setError(errorMessage);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
              {support.id === 0
                ? 'Создать нового специалиста технической поддержки'
                : 'Редактировать специалиста технической поддержки'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Информация
              </label>
              <Input
                id="info"
                placeholder="Не указано"
                value={info ?? ''}
                onChange={(e) => setInfo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {error && (
        <Dialog open={!!error} onOpenChange={() => setError(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
                Ошибка
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{error}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setError(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
