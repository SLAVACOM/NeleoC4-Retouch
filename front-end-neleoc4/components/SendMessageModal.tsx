import { Button } from '@/components/ui/button';
import { useState } from 'react';
// Если у вас есть собственный компонент Modal, замените на него:
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MyUser } from 'types/user.interface';

interface SendMessageModalProps {
  user: MyUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function SendMessageModal({
  user,
  isOpen,
  onClose,
  onSend
}: SendMessageModalProps) {
  const [message, setMessage] = useState('');

  if (!isOpen || !user) {
    return null;
  }

  const handleSubmit = () => {
    onSend(message);
    setMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отправить сообщение</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Пользователю {user.telegramUsername} (tg ID: {user.telegramId})
          </p>
          <Textarea
            placeholder="Введите сообщение"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
          <div className="flex justify-end gap-2">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>Отправить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
