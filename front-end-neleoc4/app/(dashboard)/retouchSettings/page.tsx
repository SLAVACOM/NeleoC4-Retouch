'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import {
  GetSettings,
  RetouchSettingsService
} from 'services/retouchSettings.servise';
import SettingsModal from './Modal';

export default function retouchSettings() {
  const [settings, setSettings] = useState<GetSettings>();
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState<any>(null);
  const [isBaseSetting, setIsBaseSetting] = useState(false);

  const openModal = (setting: any = null, isBase: boolean) => {
    setCurrentSetting(setting || { name: '', settings: {} });
    setIsBaseSetting(isBase);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSetting(null);
  };

  const handleSave = async (updatedSetting: any) => {
    try {
      if (isBaseSetting && updatedSetting.id) {
        await RetouchSettingsService.updateBase(updatedSetting);
      } else {
        if (updatedSetting.id)
          await RetouchSettingsService.updateSetting(updatedSetting);
        else await RetouchSettingsService.createSetting(updatedSetting);
      }
      const settings = await RetouchSettingsService.getSettings();
      setSettings(settings);
      closeModal();
    } catch (error: any) {
      console.error('Error saving setting:', error);
      if (error.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите в систему.');
      } else if (error.response?.status === 403) {
        setError(
          'Ошибка доступа. У вас нет прав для выполнения этого действия.'
        );
      } else {
        setError('Ошибка при сохранении настройки.');
      }
    }
  };

  const scrollToSetting = (id: string) => {
    console.log('scrollToSetting', id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      element.focus();
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await RetouchSettingsService.getSettings();
        setSettings(settings);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSettings();
  }, []);
  return (
    <>
      <Card>
        <Button
          className="m-4 px-2"
          variant={'outline'}
          onClick={() => openModal(null, false)}
        >
          Добавить
        </Button>

        <div className="text-3xl mx-4">Базовые настройки</div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Название</TableCell>
              <TableCell>SettingId</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings &&
              settings.baseSettings?.map((setting) => (
                <TableRow key={setting.id} id={`base-${setting.id}`}>
                  <TableCell>{setting.name}</TableCell>
                  <TableCell>{setting.settings.id}</TableCell>
                  <TableCell>
                    <Button
                      variant={'outline'}
                      onClick={() => openModal(setting, true)}
                    >
                      Редактировать
                    </Button>
                    <Button
                      variant={'outline'}
                      onClick={() =>
                        scrollToSetting(`setting-${setting.settings.id}`)
                      }
                    >
                      Перейти
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="text-3xl mx-4">Все настройки</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>Настройки</TableCell>
              <TableCell>Действие</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settings &&
              settings.settings.map((setting) => (
                <TableRow key={setting.id} id={`setting-${setting.id}`}>
                  <TableCell>{setting.id}</TableCell>
                  <TableCell>{setting.settings}</TableCell>
                  <TableCell>
                    <Button
                      variant={'outline'}
                      onClick={() => openModal(setting, false)}
                    >
                      Редактировать
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <SettingsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSave}
        setting={currentSetting}
        isBaseSetting={isBaseSetting}
        allSettings={settings?.settings ?? []}
      />

      {error && (
        <Dialog open={!!error} onOpenChange={() => setError('')}>
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
              <Button variant="outline" onClick={() => setError('')}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
