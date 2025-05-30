'use client';

import { ModuleContext } from '@/contexts/ModuleContext';
import { use, useContext } from 'react';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const mod = useContext(ModuleContext);
  return (
    <div>
      {mod}-{decodeURIComponent(id)}
    </div>
  );
}
