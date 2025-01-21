import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { CustomerFilters } from './CustomerFilters';
import { CustomerTable } from './CustomerTable';
import { AddCustomerModal } from './AddCustomerModal';

const initialCustomers = [
  {
    id: 1,
    name: 'Alice Freeman',
    email: 'alice@example.com',
    status: 'active',
    spent: 1200,
    lastOrder: '2023-12-20',
    avatar: 'https://cdn.usegalileo.ai/stability/117a7a12-7704-4917-9139-4a3f76c42e78.png'
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    status: 'inactive',
    spent: 800,
    lastOrder: '2023-12-15',
    avatar: 'https://cdn.usegalileo.ai/stability/d4e7d763-28f3-4af2-bc57-a26db12c522b.png'
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    status: 'active',
    spent: 2500,
    lastOrder: '2023-12-18',
    avatar: 'https://cdn.usegalileo.ai/stability/e9fdb59b-64bb-4239-8e52-f71e0cfb538e.png'
  },
  {
    id: 4,
    name: 'David Jones',
    email: 'david@example.com',
    status: 'active',
    spent: 3200,
    lastOrder: '2023-12-19',
    avatar: 'https://cdn.usegalileo.ai/stability/1af7ccee-eb75-4af5-b80e-ee2ec64a79ef.png'
  }
];

export function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'name'
  });

  const handleAddCustomer = (newCustomer) => {
    setCustomers([...customers, newCustomer]);
  };

  const filteredCustomers = customers.filter(customer => {
    if (filters.status !== 'all' && customer.status !== filters.status) {
      return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search)
      );
    }
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'spent':
        return b.spent - a.spent;
      case 'lastOrder':
        return new Date(b.lastOrder) - new Date(a.lastOrder);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return (
    <main className="flex-1 min-w-0 overflow-auto">
      <div className="max-w-[1440px] mx-auto animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <h1 className="text-gray-900 dark:text-white text-2xl md:text-3xl font-bold">Customers</h1>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Customer
          </Button>
        </div>

        <div className="p-4">
          <Card>
            <CardHeader>
              <CustomerFilters filters={filters} onChange={setFilters} />
            </CardHeader>
            <CardContent>
              <CustomerTable customers={filteredCustomers} />
            </CardContent>
          </Card>
        </div>
      </div>

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddCustomer}
      />
    </main>
  );
}