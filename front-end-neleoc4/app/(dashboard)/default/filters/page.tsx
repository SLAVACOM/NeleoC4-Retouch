'use client';
import { SortDirection } from 'app/(dashboard)/workers/workers.filters'
import { useEffect, useState } from 'react';

function SettingsPage() {
  const [sortOrder, setSortOrder] = useState<SortDirection>(SortDirection.Asc);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load settings on initial render
  useEffect(() => {
    const stored = localStorage.getItem('employeesSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      setSortOrder(parsed.sortOrder || SortDirection.Asc);
      setSearchTerm(parsed.searchTerm || '');
      setItemsPerPage(parsed.itemsPerPage || 10);
    }
  }, []);

  // Save settings on change
  useEffect(() => {
    localStorage.setItem(
      'employeesSettings',
      JSON.stringify({ sortOrder, searchTerm, itemsPerPage })
    );
  }, [sortOrder, searchTerm, itemsPerPage]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="font-bold text-2xl mb-6">Настройки сотрудников</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Сортировка:
        </label>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortDirection)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value={SortDirection.Asc}>По возрастанию</option>
          <option value={SortDirection.Desc}>По убыванию</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Поиск:
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Количество элементов на странице:
        </label>
        <input
          type="number"
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        />
      </div>
    </div>
  );
}

export default SettingsPage;
