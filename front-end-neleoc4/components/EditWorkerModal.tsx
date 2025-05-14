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
import { Roles } from 'types/user.interface';
import { IWorker } from 'types/workers.interface';

interface EditWorkerModalProps {
  worker: IWorker;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWorker: IWorker) => void;
}

const roles = [Roles.ADMIN, Roles.SETTINGS_MANAGER, Roles.VIALS_MANAGER];

export const EditWorkerModal: React.FC<EditWorkerModalProps> = ({
  worker,
  isOpen,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(worker.name);
  const [login, setLogin] = useState(worker.login);
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState(worker.description || '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    worker.roles || []
  );
  const [error, setError] = useState<string | null>(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isBlock, setIsBlock] = useState(worker.isDelete);

  const handleRoleChange = (role: string) => {
    setSelectedRoles((prevRoles) =>
      prevRoles.includes(role)
        ? prevRoles.filter((r) => r !== role)
        : [...prevRoles, role]
    );
  };

  const handleSave = async () => {
    const updatedWorker = {
      ...worker,
      name,
      login,
      password: showPasswordField || worker.id === 0 ? password : undefined,
      description,
      roles: selectedRoles
    };

    try {
      let res;
      if (worker.id === 0)
        res = await WorkersService.createWorker(updatedWorker);
      else res = await WorkersService.updateWorker(updatedWorker);
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
              {worker.id === 0
                ? 'Создать работника'
                : 'Редактировать работника'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Имя
              </label>
              <Input
                id="name"
                placeholder="Не указано"
                value={name ? name : ''}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="login"
                className="block text-sm font-medium text-gray-700"
              >
                Логин
              </label>
              <Input
                id="login"
                placeholder="Не указано"
                value={login ? login : ''}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
            {worker.id !== 0 && (
              <div>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                >
                  {showPasswordField ? 'Не менять пароль' : 'Изменить пароль'}
                </Button>
              </div>
            )}
            {(showPasswordField || worker.id === 0) && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  {worker.id === 0 ? 'Пароль' : 'Новый пароль'}
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Не указано"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="absolute inset-y-0 right-0 flex items-center px-4"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Скрыть' : 'Показать'}
                  </Button>
                </div>
              </div>
            )}
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

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Роли
              </label>
              {roles.map((role) => (
                <div key={role} className="flex items-center">
                  <input
                    id={role}
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleChange(role)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={role}
                    className="ml-2 block text-sm text-gray-700"
                  >
                    {role}
                  </label>
                </div>
              ))}
            </div>
            {worker.id !== 0 && (
              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBlock(!isBlock);
                    worker.isDelete = isBlock;
                  }}
                >
                  {worker.isDelete ? 'Разблокировать' : 'Заблокировать'}
                </Button>
              </div>
            )}
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
