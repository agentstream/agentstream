import { Module } from '@/common/enum';
import Overview from '@/components/Overview';
import QueryContext from '@/contexts/QueryContext';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  return (
    <QueryContext>
      <Overview module={module} />
    </QueryContext>
  );
}
