'use client';

import { EditWorkerModal } from '@/components/EditWorkerModal';
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
import { useEffect, useState } from 'react';
import { WorkersService } from 'services/workers.serevice';
import { GetWorkers, IWorker } from 'types/workers.interface';
import { Worker } from './worker';
import {
  SearchCriteria,
  SortDirection,
  SortKeys,
  Status
} from './workers.filters';

export default function WorkersPage() {
  const [data, setData] = useState<GetWorkers>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(
    SearchCriteria.Id
  );
  const [sortConfig, setSortConfig] = useState<{
    key: SortKeys;
    direction: SortDirection;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(2);
  const [activeTab, setActiveTab] = useState(Status.All);

  const fetchData = async (params: URLSearchParams) => {
    params.set('page', page.toString());  
    params.set('perPage', perPage.toString());

    const res = await WorkersService.getWorkers(
      Object.fromEntries(params.entries())
    );
    setData(res);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get('searchQuery') || '';
    const searchCriteria =
      (params.get('searchCriteria') as SearchCriteria) || SearchCriteria.Id;
    const sortKey = (params.get('sortKey') as SortKeys) || SortKeys.Id;
    const sortDirection =
      (params.get('sortDirection') as SortDirection) || SortDirection.Asc;
    const statusKey =
      (params.get('status') as Status) || Status.All;

    setSearchQuery(searchQuery);
    setSearchCriteria(searchCriteria);
    setSortConfig({ key: sortKey, direction: sortDirection });
    setPage(Number(params.get('page')) || 1);
    setActiveTab(statusKey);

    fetchData(params);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('searchQuery', searchQuery);
    params.set('searchCriteria', searchCriteria);
    if (sortConfig) {
      params.set('sortKey', sortConfig.key);
      params.set('sortDirection', sortConfig.direction);
    }
    params.set('page', page.toString());
    params.set('status', activeTab);

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${params.toString()}`
    );

    fetchData(params);
  }, [searchQuery, searchCriteria, sortConfig, page, activeTab]);

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

  const handleSave = (updatedWorker: IWorker) => {
    setData((prevData) =>
      prevData
        ? {
            ...prevData,
            data: prevData.workers.map((worker) =>
              worker.id === updatedWorker.id ? updatedWorker : worker
            )
          }
        : undefined
    );
  };

  const handleCreate = (newWorker: IWorker) => {
    setData((prevData) =>
      prevData
        ? {
            workers: [newWorker, ...prevData.workers],
            userCount: prevData.userCount + 1,
            pageCount: Math.ceil((prevData.userCount + 1) / perPage)
          }
        : { workers: [newWorker], userCount: 1, pageCount: 1 }
    );
  };

  const handleSort = (key: SortKeys) => {
    let direction: SortDirection = SortDirection.Asc;
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === SortDirection.Asc
    )
      direction = SortDirection.Desc;
    setSortConfig({ key, direction });
    updateQueryParams({ sortKey: key, sortDirection: direction });
  };

  const getSortDirectionIcon = (key: SortKeys) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === SortDirection.Asc ? '↑' : '↓';
  };

  const handleSearchCriteriaChange = (criteria: SearchCriteria) => {
    setSearchCriteria(criteria);
    setPage(1);
    updateQueryParams({ searchCriteria: criteria });
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    updateQueryParams({ searchQuery: query });
    setPage(1);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleStatusChange = (value: string) => {
    const status = value as Status;
    setActiveTab(status);
    setPage(1);
    updateQueryParams({ status: status });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Работники</CardTitle>
        <CardDescription>
          Управляйте своими работниками и просматривайте их данные.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            <option value="id">Поиск по ID</option>
            <option value="name">Поиск по Имени</option>
            <option value="login">Поиск по Логину</option>
          </select>
        </div>
        <Button
          size="sm"
          variant="default"
          className="h-8 gap-1"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Создать работника
        </Button>
        <Tabs defaultValue={activeTab} onValueChange={handleStatusChange}>
          <TabsList className="my-4">
            <TabsTrigger value={Status.All}>Все</TabsTrigger>
            <TabsTrigger value={Status.Active}>Активные</TabsTrigger>
            <TabsTrigger value={Status.Block}>Заблокированные</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.Id)}
                  >
                    ID {getSortDirectionIcon(SortKeys.Id)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.Name)}
                  >
                    Имя {getSortDirectionIcon(SortKeys.Name)}
                  </TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.IsDelete)}
                  >
                    Статус {getSortDirectionIcon(SortKeys.IsDelete)}
                  </TableHead>

                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.workers.map((worker) => (
                  <Worker key={worker.id} worker={worker} onSave={handleSave} />
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
              Math.min(data?.userCount ?? -perPage, perPage * (page - 1)) + 1
            )}{' '}
            - {Math.min(perPage * page, data?.userCount ?? perPage)}
          </strong>{' '}
          из <strong>{data?.userCount}</strong> работников
        </div>
      </CardContent>
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>
      <EditWorkerModal
        worker={
          {
            id: 0,
            login: '',
            password: '',
            roles: []
          } as IWorker
        }
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
      />
    </Card>
  );
}
