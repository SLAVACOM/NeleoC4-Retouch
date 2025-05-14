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
import { useEffect, useState } from 'react';
import { DiscountsService } from 'services/discount.service';

export default function DiscountPage() {
  const [discount, setDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const response = await DiscountsService.getDiscount();
        setDiscount(response);
      } catch (error) {
        console.error('Failed to fetch discount', error);
      }
    };

    fetchDiscount();
  }, []);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDiscount(Number(e.target.value));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await DiscountsService.updateDiscount(discount);
      alert('Успешно обновлено');
    } catch (error) {
      console.error('Failed to update discount', error);
      alert('Ошибка при обновлении');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Permanent Discount</CardTitle>
        <CardDescription>Modify the permanent discount value.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start">
          <label htmlFor="discount" className="mb-2">
            Discount Value (%)
          </label>
          <Input
            type="number"
            id="discount"
            value={discount}
            onChange={handleDiscountChange}
            className="mb-4"
          />
          <Button
            size="sm"
            variant="default"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Update Discount'}
          </Button>
        </div>
      </CardContent>
      <CardFooter>{/* Add any footer content if needed */}</CardFooter>
    </Card>
  );
}
