'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { MessageService } from 'services/message.service';

export default function MessagePage() {
  const [message, setMessage] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pinned, setPinned] = useState<boolean>(false);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length > 10) {
      alert('Макимум 10 файлов можно прикрепить одновременно');
      return;
    }

    const maxFileSize = 20 * 1024 * 1024; // 10MB в байтах
    const invalidFiles = selectedFiles.filter(
      (file) => file.size > maxFileSize
    );

    if (invalidFiles.length > 0) {
      alert(
        `Слишком большой файл. Максимальный размер файла 20MB. ${invalidFiles.map((f) => f.name).join(', ')}`
      );
      return;
    }

    setFiles(selectedFiles);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await MessageService.sendAll(message, files, pinned);
      alert('Успешно отправлено сообщение всем пользователям');
      setMessage('');
      setFiles([]);
      setPinned(false);
      const fileInput = document.getElementById(
        'file-upload'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      alert('Ошибка при отправке сообщения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Массовая рассылка всем пользователям</CardTitle>
        <CardDescription>
          Введите сообщение, которое вы хотите отправить всем пользователям. Вы
          можете прикрепить до 10 медиафайлов.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start w-full">
          <label htmlFor="message" className="mb-2">
            Сообщение
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={handleMessageChange}
            className="mb-2 w-full"
            rows={5}
          />
          <div className="self-end text-sm text-muted-foreground mb-4">
            {message.length} / 500
          </div>

          <label htmlFor="file-upload" className="mb-2">
            Прикрепить медиафайлы
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFilesChange}
            className="mb-2"
          />
          <div className="text-sm text-muted-foreground mb-4">
            {files.length} / 10
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="pinned-checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="pinned-checkbox" className="text-sm">
              Закрепить сообщение у пользователей
            </label>
          </div>

          {files.length > 0 && (
            <div className="mb-4 w-full">
              <h4 className="text-sm font-medium mb-2">файлы:</h4>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm truncate">{file.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles(files.filter((_, i) => i !== index))
                        }
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            size="sm"
            variant="default"
            onClick={handleSubmit}
            disabled={
              isSubmitting || (message.length === 0 && files.length === 0)
            }
          >
            {isSubmitting ? 'Отправка...' : 'Отправить сообщение'}
          </Button>
        </div>
      </CardContent>
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>
    </Card>
  );
}
