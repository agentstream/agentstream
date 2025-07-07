'use client';

import { Module } from '@/common/enum';
import { useModule } from '@/hooks';
import { notFound } from 'next/navigation';
import FunctionForm from '@/components/FunctionForm';
import AgentForm from '@/components/AgentForm';

const validModules = [Module.Function, Module.Agent];

const createForms = {
  [Module.Package]: null,
  [Module.Function]: <FunctionForm />,
  [Module.Agent]: <AgentForm />
};

export default function Page() {
  const mod = useModule();
  if (!validModules.includes(mod)) {
    notFound();
  }
  return createForms[mod];
}
