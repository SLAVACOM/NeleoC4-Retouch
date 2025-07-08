'use client';

import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import { useEffect, useState } from 'react'
import { StatisticsService } from 'services/statistic.service'

interface DayStatistics {
  date: string;
  totalAmount: number;
  freeGenerationCount: number;
  paidGenerationCount: number;
  totalGenerationCount: number;
  uniqueUserCount: number;
  inactiveUserCount: number;
}

interface StatisticsData {
  startDate: string;
  endDate: string;
  days: DayStatistics[];
  totalAmount: number;
  totalPayments: number;
  freeGenerationCountTotal: number;
  paidGenerationCountTotal: number;
  totalGenerations: number;
  totalUniqueUsers: number;
}

export default function StatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Устанавливаем даты по умолчанию (последние 7 дней)
  useEffect(() => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(weekAgo.toISOString().split('T')[0]);
  }, []);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await StatisticsService.getStatistics(params);
      if (response.status === 200) {
        const result = response.data;
        setData(result);
      } else alert('Ошибка при загрузке статистики');
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
      alert('Ошибка при загрузке статистики');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [startDate, endDate]);

  const handleDateChange = () => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
          <CardDescription>
            Просмотр статистики по дням с возможностью фильтрации по датам
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex flex-col">
              <label htmlFor="startDate" className="text-sm font-medium mb-1">
                Дата начала
              </label>
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="endDate" className="text-sm font-medium mb-1">
                Дата окончания
              </label>
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              onClick={handleDateChange}
              disabled={isLoading || !startDate || !endDate}
            >
              {isLoading ? 'Загрузка...' : 'Обновить'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Общая статистика */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Общая выручка
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totalAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totalPayments} платежей
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Всего генераций
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalGenerations}</div>
              <p className="text-xs text-muted-foreground">
                {data.freeGenerationCountTotal} бесплатных,{' '}
                {data.paidGenerationCountTotal} платных
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Уникальные пользователи
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalUniqueUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Период</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {formatDate(data.startDate)} - {formatDate(data.endDate)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Таблица статистики по дням */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Статистика по дням</CardTitle>
            <CardDescription>
              Детальная статистика за каждый день в выбранном периоде
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Выручка</TableHead>
                    <TableHead className="text-right">Бесплатные</TableHead>
                    <TableHead className="text-right">Платные</TableHead>
                    <TableHead className="text-right">
                      Всего генераций
                    </TableHead>
                    <TableHead className="text-right">Активные</TableHead>
                    <TableHead className="text-right">Неактивные</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.days.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {formatDate(day.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(day.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {day.freeGenerationCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {day.paidGenerationCount}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {day.totalGenerationCount}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {day.uniqueUserCount}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {day.inactiveUserCount}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Строка итого */}
                  <TableRow className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <TableCell className="font-bold">Итого</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(data.totalAmount)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {data.freeGenerationCountTotal}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {data.paidGenerationCountTotal}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {data.totalGenerations}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      {data.totalUniqueUsers}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {data.days.reduce(
                        (sum, day) => sum + day.inactiveUserCount,
                        0
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!data && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Выберите даты и нажмите "Обновить" для загрузки статистики
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
