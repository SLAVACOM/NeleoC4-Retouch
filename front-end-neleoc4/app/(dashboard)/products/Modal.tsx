import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useEffect, useState } from 'react';

interface EditProductModalProps {
  isOpen: boolean;
  product: any;
  onClose: () => void;
  onSave: (updatedProduct: any) => void;
}

export default function EditProductModal({
  isOpen,
  product,
  onClose,
  onSave
}: EditProductModalProps) {
  const [editedProduct, setEditedProduct] = useState(
    product || { name: '', description: '', price: 0, generationCount: 0, IsDelete: false }
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setEditedProduct(
      product || { name: '', description: '', price: 0, generationCount: 0, IsDelete: false }
    );
    setErrors({});
  }, [product]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setEditedProduct({ ...editedProduct, [field]: value });
    setErrors({ ...errors, [field]: '' }); 
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!editedProduct.name) newErrors.name = 'Название обязательно';
    if (!editedProduct.price || editedProduct.price <= 0)
      newErrors.price = 'Стоимость должна быть больше 0';
    if (!editedProduct.generationCount || editedProduct.generationCount <= 0)
      newErrors.generationCount = 'Количество генераций должно быть больше 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(editedProduct);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">
          {product ? 'Редактировать продукт' : 'Создать продукт'}
        </h2>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название
          </label>
          <Input
            type="text"
            placeholder="Название"
            value={editedProduct?.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name}</p>
          )}
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <Input
            type="text"
            placeholder="Описание"
            value={editedProduct?.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Стоимость
          </label>
          <Input
            type="number"
            placeholder="Стоимость"
            value={editedProduct?.price || ''}
            onChange={(e) => handleInputChange('price', Number(e.target.value))}
          />
          {errors.price && (
            <p className="text-sm text-red-500 mt-1">{errors.price}</p>
          )}
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Количество генераций
          </label>
          <Input
            type="number"
            placeholder="Количество генераций"
            value={editedProduct?.generationCount || ''}
            onChange={(e) =>
              handleInputChange('generationCount', Number(e.target.value))
            }
          />
          {errors.generationCount && (
            <p className="text-sm text-red-500 mt-1">
              {errors.generationCount}
            </p>
          )}
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Статус
          </label>
          <input
            type="checkbox"
            checked={editedProduct?.IsDelete || false}
            onChange={(e) => handleInputChange('IsDelete', e.target.checked)}
          />
          <span className="ml-2">Заблокировать</span>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            className="mr-2"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button size="sm" onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}