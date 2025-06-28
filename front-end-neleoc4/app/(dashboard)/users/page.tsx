'use client';

import { EditUserModal } from '@/components/EditUserModal';
import { SendMessageModal } from '@/components/SendMessageModal';
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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import { MessageService } from 'services/message.service';
import { UsersService } from 'services/users.service';
import { GetMyUsers, MyUser } from 'types/user.interface';
import { User } from './user';
import {
  SearchCriteria,
  SortDirection,
  SortKeys,
  UserStatus
} from './users.filters';

export default function UsersPage() {
  const [data, setData] = useState<GetMyUsers>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MyUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>(
    SearchCriteria.Id
  );
  const [sortConfig, setSortConfig] = useState<{
    key: SortKeys;
    direction: SortDirection;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(
    Number(process.env.NEXT_PUBLIC_PERPAGE_USERS) || 10
  );
  const [activeTab, setActiveTab] = useState(UserStatus.All);

  const fetchData = async (params: URLSearchParams) => {
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());

    const res = await UsersService.getUsers(
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
    const statusKey = (params.get('status') as UserStatus) || UserStatus.All;

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

  const handleSave = (updatedUser: MyUser) => {
    setData((prevData) =>
      prevData
        ? {
            ...prevData,
            data: prevData.users.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
            )
          }
        : undefined
    );
  };

  const handleCreate = (newUser: MyUser) => {
    setData((prevData) =>
      prevData
        ? {
            ...prevData,
            users: [newUser, ...prevData.users],
            totalUsers: prevData.totalUsers + 1,
            pageCount: Math.ceil((prevData.totalUsers + 1) / perPage)
          }
        : { users: [newUser], totalUsers: 1, pageCount: 1 }
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

  const handleUserStatusChange = (value: string) => {
    const status = value as UserStatus;
    setActiveTab(status);
    setPage(1);
    updateQueryParams({ status: status });
  };

  const handleSendMessage = (user: MyUser) => {
    setSelectedUser(user);
    setIsSendMessageModalOpen(true);
  };

  const handleSendMessageSubmit = (message: string) => {
    try {
      MessageService.sendToUser(selectedUser!.telegramId, message);
    } catch (e) {
      alert('Error sending message\n' + e);
      console.error('Error sending message:', e);
    }
    console.log('Sending message:', message);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Пользователи</CardTitle>
        <CardDescription>
          Управляйте своими пользователями и просматривайте их данные.
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
            <option value="telegramId">Поиск по Telegram ID</option>
          </select>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={handleUserStatusChange}>
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
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.TelegramId)}
                  >
                    Telegram ID {getSortDirectionIcon(SortKeys.TelegramId)}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort(SortKeys.CreatedAt)}
                  >
                    Дата регистрации {getSortDirectionIcon(SortKeys.CreatedAt)}
                  </TableHead>
                  <TableHead className="cursor-pointer">Баланс </TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((user) => (
                  <User
                    key={user.id}
                    user={user}
                    onSave={handleSave}
                    onSendMessage={() => handleSendMessage(user)}
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
              Math.min(data?.totalUsers ?? -perPage, perPage * (page - 1)) + 1
            )}{' '}
            - {Math.min(perPage * page, data?.totalUsers ?? perPage)}
          </strong>{' '}
          из <strong>{data?.totalUsers}</strong> пользователей
        </div>
      </CardContent>
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>
      <EditUserModal
        user={
          {
            id: 0
          } as MyUser
        }
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreate}
      />
      <SendMessageModal
        user={selectedUser!}
        isOpen={isSendMessageModalOpen}
        onClose={() => setIsSendMessageModalOpen(false)}
        onSend={handleSendMessageSubmit}
      />
    </Card>
  );
}
