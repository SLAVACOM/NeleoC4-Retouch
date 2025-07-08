'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { IMessage, MessageService } from 'services/message.service';
import EditProductModal from './Modal';

export default function TariffsPage() {
  const [data, setData] = useState<IMessage[]>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);

  const fetchData = async () => {
    const res = await MessageService.getMessages();
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditProduct = (product: any) => {
    setCurrent(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrent(null);
  };

  const handleSaveProduct = async (updatedMessage: any) => {
    try {
      if (updatedMessage.id) {
        await MessageService.updateMessage(updatedMessage);
      } else {
        await MessageService.createMessage(updatedMessage);
      }

      setCurrent(null);
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving message:', error);
      alert('Ошибка при сохранении сообщения');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сообщения</CardTitle>
        <CardDescription>
          Управляйте стандартными сообщениями бота.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{message.id}</TableCell>
                <TableCell>{message.messageName}</TableCell>
                <TableCell>{message.messageText}</TableCell>

                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditProduct(message)}
                  >
                    Редактировать
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <EditProductModal
        isOpen={isModalOpen}
        message={current}
        onClose={handleModalClose}
        onSave={handleSaveProduct}
      />
    </Card>
  );
}
