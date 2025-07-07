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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { GetMessages, GetTariffs, Messages, TariffService } from 'services/product.service';
import { Status } from '../workers/workers.filters';
import EditProductModal from './Modal';
import { MessageService } from 'services/message.service'

export default function TariffsPage() {
  const [data, setData] = useState<GetMessages>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(
    Number(process.env.NEXT_PUBLIC_PERPAGE_PRODUCTS) || 10
  );
  const [activeTab, setActiveTab] = useState(Status.All);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [current, setCurrent] = useState<any>(null);

  const fetchData = async (params: URLSearchParams) => {
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());
    params.set('status', activeTab);
    params.set('sortKey', sortKey);
    params.set('sortDirection', sortDirection);

    if (searchQuery) {
      params.set('name', searchQuery);
    }

    const res = await MessageService.getMessages(
      Object.fromEntries(params.entries())
    );
    setData(res);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('status', activeTab);
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${params.toString()}`
    );
    fetchData(params);
  }, [searchQuery, sortKey, sortDirection, page, activeTab]);

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleStatusChange = (value: string) => {
    setActiveTab(value as Status);
    setPage(1);
  };

  const handleEditProduct = (product: any) => {
    setCurrent(product);
    setIsModalOpen(true);
  };

  const handleCreateProduct = () => {
    setCurrent(null); // Очищаем текущий продукт
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrent(null);
  };

  const handleSaveProduct = async (updatedProduct: any) => {
    // if (updatedProduct.id) await MessageService.(updatedProduct);
    // else await TariffService.createProduct(updatedProduct);

    setCurrent(null);
    setIsModalOpen(false);
    fetchData(new URLSearchParams());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сообщения</CardTitle>
        <CardDescription>
          Управляйте стандарными сообщениями бота.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <Input
            type="text"
            placeholder="Поиск по имени"
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            className="mr-2"
          />
          <Button onClick={handleCreateProduct}>Создать продукт</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('id')}>
                ID {sortKey === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead onClick={() => handleSort('name')}>
                Название{' '}
                {sortKey === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead onClick={() => handleSort('description')}>
                Описание{' '}
                {sortKey === 'description' &&
                  (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>{message.id}</TableCell>
                <TableCell>{message.message_name}</TableCell>
                <TableCell>{message.message_text}</TableCell>

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
        <div className="flex justify-center mt-4">
          <Button
            size="sm"
            variant="outline"
            className="mx-1"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="mx-1"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === data?.totalPages}
          >
            Next
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Показано{' '}
          <strong>
            {Math.max(
              0,
              Math.min(data?.count ?? -perPage, perPage * (page - 1)) + 1
            )}{' '}
            - {Math.min(perPage * page, data?.count ?? perPage)}
          </strong>{' '}
          из <strong>{data?.count}</strong> тарифов
        </div>
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
