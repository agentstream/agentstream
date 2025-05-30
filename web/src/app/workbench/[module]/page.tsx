import { Module } from '@/common/enum';
import Overview from '@/components/Overview';
import ModuleContextProvider from '@/contexts/ModuleContext';
import QueryContext from '@/contexts/QueryContext';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  return (
    <QueryContext>
      <ModuleContextProvider value={module}>
        <Overview />
      </ModuleContextProvider>
    </QueryContext>
  );
}
