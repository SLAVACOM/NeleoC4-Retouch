'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { PromoCodeService } from 'services/promocode.service';
import { IPromoCode } from 'types/promocodes.interface';

interface EditPromoCodeModalProps {
  promoCode: IPromoCode;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPromoCode: IPromoCode) => void;
}

export const EditPromoCodeModal: React.FC<EditPromoCodeModalProps> = ({
  promoCode,
  isOpen,
  onClose,
  onSave
}) => {
  const [code, setCode] = useState(promoCode.code);
  const [expirationDate, setExpirationDate] = useState(
    promoCode.expirationDate
      ? new Date(promoCode.expirationDate).toISOString().split('T')[0]
      : undefined
  );
  const [isActive, setIsActive] = useState(promoCode.isActive);
  const [isMultiUse, setIsMultiUse] = useState(promoCode.isMultiUse);

  const [generationCount, setGenerationCount] = useState(
    promoCode.generationCount
  );
  const [discountPercentage, setDiscountPercentage] = useState(
    promoCode.discountPercentage
  );
  const [discountSum, setDiscountSum] = useState(promoCode.discountSum);
  const [type, setType] = useState(
    promoCode.isAddGeneration ? 'generation' : 'discount'
  );
  const [discountType, setDiscountType] = useState(
    promoCode.discountPercentage > 0 ? 'percentage' : 'sum'
  );
  const [error, setError] = useState<string | null>(null);

  const [usesLeft, setUsesLeft] = useState<number>(promoCode.usesLeft)

  useEffect(() => {
    if (promoCode.expirationDate) {
      const date = new Date(promoCode.expirationDate);
      if (!isNaN(date.getTime()))
        setExpirationDate(date.toISOString().split('T')[0]);
    }
  }, [promoCode.expirationDate]);

  const handleSave = async () => {
    if (
      !code ||
      (type === 'discount' && !discountSum && !discountPercentage) ||
      (type === 'generation' && !generationCount)
    ) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }

    const updatedPromoCode = {
      ...promoCode,
      code,
      expirationDate: expirationDate
        ? new Date(expirationDate).toISOString()
        : undefined,
      isActive,
      generationCount: type === 'generation' ? generationCount : 0,
      discountPercentage:
        type === 'discount' && discountType === 'percentage'
          ? discountPercentage
          : 0,
      discountSum:
        type === 'discount' && discountType === 'sum' ? discountSum : 0,
      isAddGeneration: type === 'generation',
      isDiscount: type === 'discount',
      usesLeft,
      isMultiUse
    };
    let res;
    if (promoCode.id === -1)
      res = await PromoCodeService.create(updatedPromoCode);
    else res = await PromoCodeService.update(updatedPromoCode, promoCode.code);
    if (res.status === 200) {
      onSave(res.data);

      onClose();
    } else setError(res.data.message || 'Произошла ошибка.');
  };

  const generateRandomCode = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++)
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    setCode(result);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
              {(promoCode.id === -1 ? 'Создать ' : 'Редактировать ') +
                'промокод'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Код
              </label>
              <div className="flex">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-grow"
                />
                {promoCode.id === -1 && (
                  <Button
                    variant="outline"
                    onClick={generateRandomCode}
                    className="ml-2"
                  >
                    Сгенерировать
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label
                htmlFor="expirationDate"
                className="block text-sm font-medium text-gray-700"
              >
                Дата истечения
              </label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="isActive"
                className="block text-sm font-medium text-gray-700"
              >
                Активен
              </label>
              <Input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
             <div>
              <label
                htmlFor="isMultiUse"
                className="block text-sm font-medium text-gray-700"
              >
                Несколько использований
              </label>
              <Input
                id="isMultiUse"
                type="checkbox"
                checked={isMultiUse}
                onChange={(e) => setIsMultiUse(e.target.checked)}
              />
            </div>
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Тип
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="discount">Скидка</option>
                <option value="generation">Генерация</option>
              </select>
            </div>
            {type === 'discount' && (
              <>
                <div>
                  <label
                    htmlFor="discountType"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Тип скидки
                  </label>
                  <select
                    id="discountType"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="percentage">Процент</option>
                    <option value="sum">Сумма</option>
                  </select>
                </div>
                {discountType === 'percentage' && (
                  <div>
                    <label
                      htmlFor="discountPercentage"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Процент скидки
                    </label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      step={0.01}
                      max={100}
                      value={discountPercentage}
                      onChange={(e) =>
                        setDiscountPercentage(Number(e.target.value))
                      }
                    />
                  </div>
                )}
                {discountType === 'sum' && (
                  <div>
                    <label
                      htmlFor="discountSum"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Сумма скидки
                    </label>
                    <Input
                      id="discountSum"
                      type="number"
                      step={0.01}
                      value={discountSum}
                      onChange={(e) => setDiscountSum(Number(e.target.value))}
                    />
                  </div>
                )}
              </>
            )}
            {type === 'generation' && (
              <div>
                <label
                  htmlFor="generationCount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Количество генераций
                </label>
                <Input
                  id="generationCount"
                  type="number"
                  value={generationCount}
                  min={1}
                  onChange={(e) => setGenerationCount(Number(e.target.value))}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="usesLeft"
                className="block text-sm font-medium text-gray-700"
              >
                Количество использований(осталось)
              </label>
              <Input
                id="usesLeft"
                type="number"
                value={usesLeft}
                min={1}
                onChange={(e) => setUsesLeft(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {error && (
        <Dialog open={!!error} onOpenChange={() => setError(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">
                Ошибка
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{error}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setError(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
