import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { useEffect, useState } from 'react';
import { IMessage } from 'services/message.service';

interface EditProductModalProps {
  isOpen: boolean;
  message?: IMessage | null;
  onClose: () => void;
  onSave: (updatedMessage: any) => void;
}

export default function EditMessageModal({
  isOpen,
  message = null,
  onClose,
  onSave
}: EditProductModalProps) {
  const [editedMessage, setEditedMessage] = useState<Partial<IMessage>>({
    messageName: '',
    messageText: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (message) {
      setEditedMessage(message);
    } else {
      setEditedMessage({
        messageName: '',
        messageText: ''
      });
    }
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
    if (!editedMessage.messageName || editedMessage.messageName.trim() === '') {
      newErrors.messageName = 'Название обязательно';
    }
    if (!editedMessage.messageText || editedMessage.messageText.trim() === '') {
      newErrors.messageText = 'Текст обязателен';
    }
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
            value={editedMessage.messageName || ''}
            onChange={(e) => handleInputChange('messageName', e.target.value)}
          />
          {errors.messageName && (
            <p className="text-sm text-red-500 mt-1">{errors.messageName}</p>
          )}
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текст сообщения
          </label>
          <Textarea
            placeholder="Текст сообщения"
            value={editedMessage.messageText || ''}
            onChange={(e) => handleInputChange('messageText', e.target.value)}
            rows={5}
            className="w-full"
          />
          {errors.messageText && (
            <p className="text-sm text-red-500 mt-1">{errors.messageText}</p>
          )}
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
