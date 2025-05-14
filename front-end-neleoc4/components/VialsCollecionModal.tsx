'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useState } from 'react';
import { VialsService } from 'services/vials.service';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface EditCollectionModalProps {
  collection: VialCollection;
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: VialCollection) => void;
}
export const EditCollectionModal: React.FC<EditCollectionModalProps> = ({
  collection,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(collection.name || '');
  const [description, setDescription] = useState(collection.description || '');

  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const updatedCollection = {
      ...collection,

      name: name,
      description: description
    };

    try {
      let res;
      if (collection.id === 0)
        res = await VialsService.createCollection(updatedCollection);
      else res = await VialsService.updateCollection(updatedCollection);

      if (res.status !== 200) {
        setError(res.data.message.join(', '));
        throw new Error(res.data.message.join(', '));
      }

      onSave(res.data);
      onClose();
    } catch (error: any) {
      const errorMessage = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join(', ')
        : error.message;
      setError(errorMessage);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
              {collection.id === 0
                ? 'Создать коллекцию'
                : 'Редактировать коллекцию'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Название
              </label>
              <Input
                id="name"
                placeholder="Не указано"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Описание
              </label>
              <Input
                id="description"
                placeholder="Не указано"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
