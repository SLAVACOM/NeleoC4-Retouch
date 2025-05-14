import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { EditCollectionModal } from '@/components/VialsCollecionModal';
import React, { useState } from 'react';
import { Vial } from './Vial';

interface CollectionTableProps {
  collection: VialCollection;
  openModal: () => void;
  openVialModal: (vial: Vial) => void;
  onSave: (collection: VialCollection) => void;
}

const CollectionTable: React.FC<CollectionTableProps> = ({
  collection,
  openVialModal,
  openModal,
  onSave
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleModalClose = () => {
    setIsEditModalOpen(false);
  };
  return (
    <>
      <div>
        <div className="flex  items-center mb-3">
          <div className="my-3 pr-2 text-2xl">Коллекция {collection.id}</div>
          <Button className="" variant={'outline'} onClick={handleEditClick}>
            Изменить
          </Button>
        </div>
        <div>Название: {collection.name}</div>
        <div className="mb-3">
          Описание:{' '}
          {collection.description ? collection.description : 'не указано'}
        </div>
      </div>
      <Button
        onClick={openModal}
        variant="default"
        size="default"
        className="mb-3"
      >
        Создать флакон
      </Button>
      {!collection.Vials || collection.Vials.length === 0 ? (
        <div className="text-left text-xl mb-10 text-gray-500">
          Нет флаконов
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>id</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Фото</TableHead>
              <TableHead>Дата создания</TableHead>
              <TableHead>Дата обновления</TableHead>
              <TableHead>Удалено</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {collection.Vials?.map((vial) => (
              <Vial key={vial.id} vial={vial} onOpen={openVialModal} />
            ))}
          </TableBody>
        </Table>
      )}
      <EditCollectionModal
        collection={collection}
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSave={onSave}
      />
    </>
  );
};

export default CollectionTable;
