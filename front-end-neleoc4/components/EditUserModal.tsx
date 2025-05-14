import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { IUser, MyUser } from 'types/user.interface'

interface EditUserModalProps {
  user: MyUser;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: MyUser) => void;
}

export function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave
}: EditUserModalProps) {
  const [formData, setFormData] = useState<MyUser>(user);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать пользователя</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
         
          <Input
            name="telegramId"
            value={formData.telegramId}
            onChange={handleChange}
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>Сохранить</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
