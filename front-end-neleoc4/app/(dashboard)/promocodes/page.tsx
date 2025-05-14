'use client';

import { EditPromoCodeModal } from '@/components/EditPromoCodeModal';
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
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PromoCodeService } from 'services/promocode.service';
import { GetPromoCodes, IPromoCode } from 'types/promocodes.interface';
import { PromoCode } from './promocode';
import { Direction, SearchCriteria, SortKeys } from './promocodes.filters';

export default function CustomersPage() {
  const [data, setData] = useState<GetPromoCodes>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(
    SearchCriteria.Id
  );
  const [promoType, setPromoType] = useState('all');
  const [sortConfig, setSortConfig] = useState<{
    key: SortKeys;
    direction: Direction;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (params: URLSearchParams) => {
    try {
      params.set('page', page.toString());
      params.set('perPage', perPage.toString());

      const res = await PromoCodeService.getPromoCodes(
        Object.fromEntries(params.entries())
      );
      setData(res);
    } catch (err) {
      setError('Failed to fetch promo codes');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('searchQuery') || '';
    const searchCriteria =
      (params.get('searchCriteria') as SearchCriteria) || SearchCriteria.Code;
    const sortKey = (params.get('sortKey') as SortKeys) || SortKeys.Code;
    const sortDirection =
      (params.get('sortDirection') as Direction) || Direction.Asc;
    const promoType = params.get('promoType') || 'all';

    setSearchQuery(searchQuery);
    setSearchCriteria(searchCriteria);
    setSortConfig({ key: sortKey, direction: sortDirection });
    setPromoType(promoType);
    setPage(Number(params.get('page')) || 1);

    fetchData(params);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('searchQuery', searchQuery);
    params.set('searchCriteria', searchCriteria);
    params.set('promoType', promoType);

    if (sortConfig) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDirection', sortConfig.direction);
    }
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${params.toString()}`
    );

    fetchData(params);
  }, [searchQuery, searchCriteria, sortConfig, page, promoType]);

  const updateQueryParams = (params: Record<string, string>) => {
    const urlParams = new URLSearchParams(window.location.search);
    Object.keys(params).forEach((key) => {
      urlParams.set(key, params[key]);
    });
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${urlParams.toString()}`
    );
  };

  const handleSave = (updatedPromoCode: IPromoCode) => {
    setData((prevData) =>
      prevData
        ? {
            ...prevData,
            promos: prevData.promos.map((promoCode) =>
              promoCode.id === updatedPromoCode.id
                ? updatedPromoCode
                : promoCode
            )
          }
        : undefined
    );
  };

  const handleCreate = (newPromoCode: IPromoCode) => {
    setData((prevData) =>
      prevData
        ? {
            ...prevData,
            promos: [newPromoCode, ...prevData.promos]
          }
        : { promos: [newPromoCode], productCount: 1, pageCount: 1 }
    );
  };

  const handleExport = async () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'promo-codes.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: SortKeys) => {
    let direction: Direction = Direction.Asc;
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === Direction.Asc
    )
      direction = Direction.Desc;
    setSortConfig({ key, direction });
    updateQueryParams({ sortKey: key, sortDirection: direction });
  };

  const handleChangePromoType = (type: string) => {
    setPromoType(type);
    updateQueryParams({ promoType: type });
  };

  const getSortDirectionIcon = (key: SortKeys) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === Direction.Asc ? '↑' : '↓';
  };

  const handleSearchCriteriaChange = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    updateQueryParams({ searchCriteria: criteria });
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    updateQueryParams({ searchQuery: query });
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Промокоды</CardTitle>
        <CardDescription>
          Manage your promo codes and view their details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            className="mr-2 my-4"
          />
          <select
            value={searchCriteria}
            onChange={(e) =>
              handleSearchCriteriaChange(e.target.value as SearchCriteria)
            }
            className="mr-2 outline-none border border-gray-300 rounded-md py-2 px-2 my-4"
          >
            <option value="code">Поиск по коду</option>
            <option value="id">Поиск по ID</option>
            <option value="expirationDateLess">Дата истечения меньше</option>
            <option value="expirationDateGreater">Дата истечения больше</option>
          </select>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1"
          onClick={handleExport}
        >
          <File className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Export
          </span>
        </Button>
        <Button
          size="sm"
          variant="default"
          className="mx-2 h-8 gap-1"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Создать промокод
        </Button>
        <Tabs defaultValue={promoType} onValueChange={handleChangePromoType}>
          <TabsList className="my-4">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="addGen">Генерация</TabsTrigger>
            <TabsTrigger value="discountSum">Сумма в рублях</TabsTrigger>
            <TabsTrigger value="discountPer" className="hidden sm:flex">
              Сумма в процентах
            </TabsTrigger>
          </TabsList>
          <TabsContent value={promoType}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.Id)}
                  >
                    id {getSortDirectionIcon(SortKeys.Id)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.Code)}
                  >
                    Code {getSortDirectionIcon(SortKeys.Code)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.isDiscount)}
                  >
                    Is Discount {getSortDirectionIcon(SortKeys.isDiscount)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.DiscountSum)}
                  >
                    Discount {getSortDirectionIcon(SortKeys.DiscountSum)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.ExpirationDate)}
                  >
                    Expiration Date{' '}
                    {getSortDirectionIcon(SortKeys.ExpirationDate)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.IsActive)}
                  >
                    Status {getSortDirectionIcon(SortKeys.IsActive)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.promos.map((promoCode) => (
                  <PromoCode
                    key={promoCode.id}
                    promoCode={promoCode}
                    onSave={handleSave}
                  />
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
            disabled={page === data?.pageCount}
          >
            Next
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Показано{' '}
          <strong>
            {Math.max(
              0,
              Math.min(
                data?.productCount ?? -perPage,
                perPage * (page - 1)
              ) + 1
            )} - {
              Math.min(perPage * (page), data?.productCount ?? perPage)}
          </strong>{' '}
          из <strong>{data?.productCount}</strong> промокодов
        </div>
      </CardContent>
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>
      <EditPromoCodeModal
        promoCode={
          {
            id: -1,
            code: '',
            expirationDate: undefined,
            isActive: true,
            generationCount: 0,
            discountPercentage: 0,
            discountSum: 0,
            isAddGeneration: false,
            isDiscount: false
          } as IPromoCode
        }
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
      />
    </Card>
  );
}
