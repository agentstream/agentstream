'use client';

import { Module } from '@/common/enum';
import { useModule } from '@/hooks';
import { notFound } from 'next/navigation';
import FunctionForm from '@/components/FunctionForm';
import AgentForm from '@/components/AgentForm';
import { canChange } from '@/common/utils';
import { NamespaceContextProvider } from '@/contexts/NamespaceContext';

const createForms = {
  [Module.Package]: null,
  [Module.Function]: <FunctionForm />,
  [Module.Agent]: <AgentForm />
};

export default function Page() {
  const mod = useModule();
  if (!canChange(mod)) {
    notFound();
  }
  return <NamespaceContextProvider>{createForms[mod]}</NamespaceContextProvider>;
}
