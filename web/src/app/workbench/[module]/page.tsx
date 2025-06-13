'use client';

import { Module } from '@/common/enum';
import { parseResourceData } from '@/common/utils';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import LoadingPlaceHolder from '@/components/common/LoadingPlaceHolder';
import ToolCard from '@/components/common/ToolCard';
import { listAllAgents } from '@/server/logics/agent';
import { listAllFunctions } from '@/server/logics/function';
import { listAllPackages } from '@/server/logics/package';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';

const fetchAction = {
  [Module.Package]: listAllPackages,
  [Module.Function]: listAllFunctions,
  [Module.Agent]: listAllAgents
};

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  const { data, isPending, isError } = useQuery({
    queryKey: [module],
    queryFn: fetchAction[module]
  });
  return (
    <div className="overflow-auto w-full h-full">
      {isPending ? (
        <LoadingPlaceHolder />
      ) : isError ? (
        <EmptyPlaceHolder />
      ) : data && data.items.length > 0 ? (
        <div className="grid grid-cols-1 min-[660px]:grid-cols-2 min-[960px]:grid-cols-3 min-[1270px]:grid-cols-4 min-[1620px]:grid-cols-5 gap-2">
          {data.items.map(v => (
            <div key={v.metadata.uid}>
              <ToolCard info={parseResourceData(v)} type={module} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyPlaceHolder />
      )}
    </div>
  );
}
