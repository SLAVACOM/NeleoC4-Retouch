import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect, useState } from 'react';

interface EditProductModalProps {
  isOpen: boolean;
  message?: {
    id?: number;
    name: string;
    text: string;
  };
  onClose: () => void;
  onSave: (updatedMessage: any) => void;
}

export default function EditMessageModal({
  isOpen,
  message = {
    id: 0,
    name: '',
    text: ''
  },
  onClose,
  onSave
}: EditProductModalProps) {
  const [editedMessage, setEditedMessage] = useState(message);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setEditedMessage(message || { name: '', text: '' });
    setErrors({});
  }, [message]);

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setEditedMessage({ ...editedMessage, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (editedMessage.name) newErrors.name = 'Название обязательно';
    if (!editedMessage.text) newErrors.text = 'Текст обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(editedMessage);
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">
          {message?.id ? 'Редактировать сообщение' : 'Создать сообщение'}
        </h2>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название
          </label>
          <Input
            type="text"
            placeholder="Название"
            value={editedMessage.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текст сообщения
          </label>
          <Input
            type="text"
            placeholder="Текст"
            value={editedMessage.text}
            onChange={(e) => handleInputChange('text', e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="mr-2"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
