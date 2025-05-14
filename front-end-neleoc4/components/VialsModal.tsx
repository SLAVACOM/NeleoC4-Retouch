'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { VialsService } from 'services/vials.service';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface EditVialModalProps {
  vial: Vial;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (vial: Vial) => void;
  onSave: (vial: Vial) => void;
}

export const EditVialModal: React.FC<EditVialModalProps> = ({
  vial,
  isOpen,
  onClose,
  onCreate,
  onSave
}) => {
  const [name, setName] = useState<string | null>(vial.name);
  const [photoUrl, setPhotoUrl] = useState<string | null>(vial.photoUrl);
  const [isDelete, setDelete] = useState<boolean | null>(vial.isDelete);
  const [isPhotoUrlValid, setIsPhotoUrlValid] = useState<boolean>(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validatePhotoUrl(photoUrl);
  }, [photoUrl]);

  useEffect(() => {
    setName(vial.name);
    setPhotoUrl(vial.photoUrl);
    setDelete(vial.isDelete);
  }, [vial]);

  const validatePhotoUrl = (url: string | null) => {
    if (!url) {
      setIsPhotoUrlValid(false);
      return;
    }
    const img = new Image();
    img.onload = () => setIsPhotoUrlValid(true);
    img.onerror = () => setIsPhotoUrlValid(false);
    img.src = url;
  };

  const handleSave = async () => {
    const updatedVial = {
      ...vial,
      name: name ?? vial.name,
      photoUrl: photoUrl ?? vial.photoUrl,
      isDelete: isDelete ?? vial.isDelete
    };

    try {
      let res;
      if (vial.id === 0) res = await VialsService.createVial(updatedVial);
      else res = await VialsService.updateVial(updatedVial);

      if (res.status !== 200) {
        setError(res.data.message.join(', '));
        throw new Error(res.data.message.join(', '));
      }

      if (vial.id === 0) onCreate(res.data);
      else onSave(res.data);
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
              {vial.id === 0 ? 'Создать флакон' : 'Редактировать флакон'}
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
                value={name ?? ''}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="photoUrl"
                className="block text-sm font-medium text-gray-700"
              >
                Ссылка на фотографию
              </label>
              <Input
                id="photoUrl"
                placeholder="Не указано"
                value={photoUrl ?? ''}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />{' '}
              {!isPhotoUrlValid && (
                <p className="text-red-500 text-sm">
                  Неверная ссылка на изображение
                </p>
              )}
              {isPhotoUrlValid && photoUrl && (
                <img src={photoUrl} alt="Preview" className="mt-2 max-h-40" />
              )}
            </div>
          </div>

          {vial.id !== 0 && (
            <div>
              <label
                htmlFor="isDelete"
                className="block text-sm font-medium text-gray-700"
              >
                Удален
              </label>
              <input
                type="checkbox"
                id="isDelete"
                className="h-10 w text-indigo-600 border-gray-300 rounded"
                checked={isDelete ?? false}
                onChange={(e) => setDelete(e.target.checked)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={!isPhotoUrlValid || !name}>
              Сохранить
            </Button>
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
