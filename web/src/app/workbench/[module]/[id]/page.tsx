'use client';

import { Module } from '@/common/enum';
import FunctionDetail from '@/components/FunctionDetail';
import PackageDetail from '@/components/PackageDetail';
import { useModule } from '@/hooks';
import { use } from 'react';

function detailPage(module: Module, name: string, namespace: string) {
  switch (module) {
    case Module.Package:
      return <PackageDetail name={name} namespace={namespace} />;
    case Module.Function:
      return <FunctionDetail name={name} namespace={namespace} />;
    case Module.Agent:
      return null;
  }
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [namespace, name] = decodeURIComponent(id).split('/');
  const mod = useModule();
  return <div className="overflow-auto w-full h-full">{detailPage(mod, name, namespace)}</div>;
}
