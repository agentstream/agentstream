import { Module } from '@/common/enum';
import Overview from '@/components/Overview';
import ModuleContextProvider from '@/contexts/ModuleContext';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  return (
    <ModuleContextProvider value={module}>
      <Overview />
    </ModuleContextProvider>
  );
}
