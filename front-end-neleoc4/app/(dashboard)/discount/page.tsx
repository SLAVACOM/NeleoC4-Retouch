'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { DiscountsService } from 'services/discount.service';

export default function DiscountPage() {
  const [discount, setDiscount] = useState<number>(0);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [isSubmittingDiscount, setIsSubmittingDiscount] =
    useState<boolean>(false);
  const [isSubmittingGenerationCount, setIsSubmittingGenerationCount] =
    useState<boolean>(false);
  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const response = await DiscountsService.getDiscount();
        setDiscount(response);
      } catch (error) {
        console.error('Failed to fetch discount', error);
      }
    };

    const fetchGenerationCount = async () => {
      try {
        const response = await DiscountsService.getGenerationCount();
        setGenerationCount(response);
      } catch (error) {
        console.error('Failed to fetch generation count', error);
      }
    };

    fetchDiscount();
    fetchGenerationCount();
  }, []);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscount(Number(e.target.value));
  };
  const handleGenerationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGenerationCount(Number(e.target.value));
  };

  const handleSubmitDiscount = async () => {
    setIsSubmittingDiscount(true);
    try {
      await DiscountsService.updateDiscount(discount);
      alert('Успешно обновлено');
    } catch (error) {
      console.error('Failed to update discount', error);
      alert('Ошибка при обновлении');
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleSubmitGenerationCount = async () => {
    setIsSubmittingGenerationCount(true);
    try {
      await DiscountsService.updateGenerationCount(generationCount);
      alert('Успешно обновлено');
    } catch (error) {
      console.error('Failed to update generation count', error);
      alert('Ошибка при обновлении');
    } finally {
      setIsSubmittingGenerationCount(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Редактировать постоянную скидку</CardTitle>
          <CardDescription>
            Редактировать постоянную скидку для Пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start">
            <label htmlFor="discount" className="mb-2">
              Скидка (%)
            </label>
            <Input
              type="number"
              id="discount"
              value={discount}
              onChange={handleDiscountChange}
              className="mb-4"
              min={0}
            />
            <Button
              size="sm"
              variant="default"
              onClick={handleSubmitDiscount}
              disabled={isSubmittingDiscount}
            >
              {isSubmittingDiscount ? 'Обновление...' : 'Обновить скидку'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Редактировать количество генераций в день</CardTitle>
          <CardDescription>
            Редактировать количество бесплатных генераций в день для
            пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start">
            <label htmlFor="generationCount" className="mb-2">
              Количество (шт)
            </label>
            <Input
              type="number"
              id="generationCount"
              value={generationCount}
              onChange={handleGenerationChange}
              className="mb-4"
              min={0}
            />
            <Button
              size="sm"
              variant="default"
              onClick={handleSubmitGenerationCount}
              disabled={isSubmittingGenerationCount}
            >
              {isSubmittingGenerationCount
                ? 'Обновление...'
                : 'Обновить количество'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
