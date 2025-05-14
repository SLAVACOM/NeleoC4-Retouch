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
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GetPayments, PaymentsService } from 'services/payments.service';

export default function PaymentsPage() {

  const [data, setData] = useState<GetPayments>();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<'id' | 'userId'>('id');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const router = useRouter();


  const fetchData = async (params: URLSearchParams) => {
    params.set('page', page.toString());
    params.set('perPage', perPage.toString());
    params.set('searchQuery', searchQuery);
    params.set('searchCriteria', searchCriteria);
    params.set('sortKey', sortKey);
    params.set('sortDirection', sortDirection);

    const res = await PaymentsService.getPayments(
      Object.fromEntries(params.entries())
    );
    setData(res);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get('searchQuery') || '');
    setSearchCriteria(
      (params.get('searchCriteria') as 'id' | 'userId') || 'id'
    );
    setSortKey(params.get('sortKey') || 'createdAt');
    setSortDirection((params.get('sortDirection') as 'asc' | 'desc') || 'desc');
    setPage(Number(params.get('page')) || 1);

    fetchData(params);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('searchQuery', searchQuery);
    params.set('searchCriteria', searchCriteria);
    params.set('sortKey', sortKey);
    params.set('sortDirection', sortDirection);
    params.set('page', page.toString());

    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${params.toString()}`
    );

    fetchData(params);
  }, [searchQuery, searchCriteria, sortKey, sortDirection, page]);

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleSearchCriteriaChange = (criteria: 'id' | 'userId') => {
    setSearchCriteria(criteria);
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

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handleUserClick = (userId: number) => {
    router.push(`users/${userId}/more-info`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Платежи</CardTitle>
        <CardDescription>
          Управляйте платежами и просматривайте их данные.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Input
            type="text"
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            className="mr-2"
          />
          <select
            value={searchCriteria}
            onChange={(e) =>
              handleSearchCriteriaChange(e.target.value as 'id' | 'userId')
            }
            className="border rounded px-2 py-1"
          >
            <option value="id">По ID</option>
            <option value="userId">По ID пользователя</option>
          </select>
        </div>

        <Tabs defaultValue="all">
          <TabsContent value="all">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('id')}>
                    ID{' '}
                    {sortKey === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead onClick={() => handleSort('amount')}>
                    Сумма{' '}
                    {sortKey === 'amount' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Пользователь</TableHead>
                  <TableHead onClick={() => handleSort('createdAt')}>Дата{' '}
                    {sortKey === 'createdAt' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}</TableHead>
                  <TableHead onClick={() => handleSort('generationCount')}>
                    Количество генераций{' '}
                    {sortKey === 'generationCount' &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.id}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        onClick={() => handleUserClick(payment.user.id)}
                      >
                        {payment.user.telegramUsername}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.generationCount}</TableCell>
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
            disabled={page === data?.pagesCount}
          >
            Next
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Показано{' '}
          <strong>
            {Math.max(
              0,
              Math.min(data?.totalPayments ?? -perPage, perPage * (page - 1)) +
                1
            )}{' '}
            - {Math.min(perPage * page, data?.totalPayments ?? perPage)}
          </strong>{' '}
          из <strong>{data?.totalPayments}</strong> пользователей
        </div>
      </CardContent>
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>
    </Card>
  );
}
