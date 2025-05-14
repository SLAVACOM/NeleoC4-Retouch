'use client';

import { EditCollectionModal } from '@/components/VialsCollecionModal'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import CollectionTable from './CollectionTable'

import { EditVialModal } from '@/components/VialsModal'
import { useEffect, useState } from 'react'
import { VialsService } from 'services/vials.service'

export default function VialsPage() {
  const [data, setData] = useState<VialCollection[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateVialModalOpen, setIsCreateVialModalOpen] = useState(false);
  const [collectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [selectedVial, setSelectedVial] = useState<Vial | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await VialsService.getVials();
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch vials');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveCollection = (updatedCollection: VialCollection) => {
    setData((prevData) =>
      prevData.map((collection) =>
        collection.id === updatedCollection.id ? updatedCollection : collection
      )
    );
  };

  const handleCreateCollection = (collection: VialCollection) => {
    setData((prevData) =>
      prevData ? [collection, ...prevData] : [collection]
    );
  };

  const handleSaveVials = (vial: Vial) => {
    setData((prevData) =>
      prevData.map((collection) =>
        collection.Vials.some((v) => v.id === vial.id)
          ? {
              ...collection,
              Vials: collection.Vials.map((v) => (v.id === vial.id ? vial : v))
            }
          : collection
      )
    );
  };

  const handleCreateVial = (vial: Vial) => {
    setData((prevData) =>
      prevData.map((collection) =>
        collection.id === vial.vialCollectionId
          ? { ...collection, Vials: [vial, ...collection.Vials] }
          : collection
      )
    );
  };

  const handleEditVial = (vial: Vial) => {
    setSelectedVial(vial);
    setIsCreateVialModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vial Collections</CardTitle>
        <CardDescription>
          Manage your vial collections and view their details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}

        <Button
          size="sm"
          variant="default"
          className="my-2 h-8 gap-1"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Создать коллекцию
        </Button>
        {data.map((collection) => (
          <CollectionTable
            key={collection.id}
            openModal={() => {
              setIsCreateVialModalOpen(true);
              setSelectedCollectionId(collection.id);
            }}
            openVialModal={handleEditVial}
            collection={collection}
            onSave={handleSaveCollection}
          />
        ))}
      </CardContent>
      <EditCollectionModal
        collection={{ id: 0, Vials: [] as Vial[] } as VialCollection}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateCollection}
      />
      <EditVialModal
        vial={selectedVial ?? { id: 0, vialCollectionId: collectionId } as Vial}
        isOpen={isCreateVialModalOpen}
        onClose={() => setIsCreateVialModalOpen(false)}
        onCreate={handleCreateVial}
        onSave={handleSaveVials}
      />
    </Card>
  );
}
