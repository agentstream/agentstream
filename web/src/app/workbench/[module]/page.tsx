'use client';

import { Module } from '@/common/enum';
import Overview from '@/components/Overview';
import { use } from 'react';

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  return <Overview module={module} />;
}
