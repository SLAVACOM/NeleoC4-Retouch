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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { GetTariffs, TariffService } from 'services/product.service';
import { Status } from '../workers/workers.filters';
import EditProductModal from './Modal';

export default function TariffsPage() {
  const [data, setData] = useState<GetTariffs>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [activeTab, setActiveTab] = useState(Status.All);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  const fetchData = async (params: URLSearchParams) => {
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());
    params.set('status', activeTab);
    params.set('sortKey', sortKey);
    params.set('sortDirection', sortDirection);

    if (searchQuery) {
      params.set('name', searchQuery);
    }

    const res = await TariffService.getTariffs(
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
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleCreateProduct = () => {
    setCurrentProduct(null); // Очищаем текущий продукт
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSaveProduct = async (updatedProduct: any) => {
    if (updatedProduct.id) await TariffService.updateProduct(updatedProduct);
    else await TariffService.createProduct(updatedProduct);

    setCurrentProduct(null);
    setIsModalOpen(false);
    fetchData(new URLSearchParams());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Тарифы</CardTitle>
        <CardDescription>
          Управляйте тарифами и просматривайте их данные.
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

        <Tabs value={activeTab} onValueChange={handleStatusChange}>
          <TabsList className="my-4">
            <TabsTrigger value={Status.All}>Все</TabsTrigger>
            <TabsTrigger value={Status.Active}>Активные</TabsTrigger>
            <TabsTrigger value={Status.Block}>Заблокированные</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('id')}>
                    ID{' '}
                    {sortKey === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('name')}>
                    Название{' '}
                    {sortKey === 'name' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('description')}>
                    Описание{' '}
                    {sortKey === 'description' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('generationCount')}>
                    Генерации{' '}
                    {sortKey === 'generationCount' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('price')}>
                    Стоимость{' '}
                    {sortKey === 'price' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('IsDelete')}>
                    Статус{' '}
                    {sortKey === 'IsDelete' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.generationCount}</TableCell>
                    <TableCell>{product.price} руб.</TableCell>
                    <TableCell>
                      {product.IsDelete ? 'Не активен' : 'Активен'}
                    </TableCell>

                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditProduct(product)}
                      >
                        Редактировать
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
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
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>

      {/* Подключение модального окна */}
      <EditProductModal
        isOpen={isModalOpen}
        product={currentProduct}
        onClose={handleModalClose}
        onSave={handleSaveProduct}
      />
    </Card>
  );
}
