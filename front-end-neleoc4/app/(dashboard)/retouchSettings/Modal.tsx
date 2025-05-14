import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import {
  DropdownMenu,
  DropdownMenuTrigger
} from '@radix-ui/react-dropdown-menu';
import React, { useEffect, useState } from 'react';
import { Settings } from 'services/retouchSettings.servise';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSetting: any) => void;
  setting: any;
  isBaseSetting: boolean;
  allSettings: Settings[];
}

const SettingsModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSave,
  setting,
  isBaseSetting,
  allSettings
}) => {
  const [name, setName] = useState(setting?.name || '');
  const [settingId, setSettingId] = useState(setting?.settings.id || '');
  const [settings, setSettings] = useState(
    JSON.stringify(setting?.settings || '')
  );

  useEffect(() => {
    if (isOpen) {
      setName(setting?.name || '');
      setSettingId(setting?.settings.id || '');
      setSettings(JSON.stringify(setting?.settings || ''));
    }
  }, [isOpen, setting]);

  const handleSave = () => {
    const updatedSetting = isBaseSetting
      ? { ...setting, name, settingsId: settingId }
      : { ...setting, settings: settings };
    onSave(updatedSetting);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
            {isBaseSetting
              ? 'Редактировать базовую настройку'
              : 'Редактировать настройку'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isBaseSetting ? (
            <>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Название
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label
                  htmlFor="settingId"
                  className="block text-sm font-medium text-gray-700"
                >
                  SettingId
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-gray-700">
                      {settingId}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {allSettings.map((set) => (
                      <DropdownMenuItem
                        key={set.id}
                        onSelect={() => setSettingId(set.id)}
                      >
                        {set.id}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <div>
              <label
                htmlFor="settings"
                className="block text-sm font-medium text-gray-700"
              >
                Настройки
              </label>
              <textarea
                id="settings"
                value={settings}
                onChange={(e) => setSettings(e.target.value)}
                className="textarea"
              />
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
  );
};

export default SettingsModal;
