'use client';

import { Module } from '@/common/enum';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import LoadingPlaceHolder from '@/components/common/LoadingPlaceHolder';
import ToolCard from '@/components/common/ToolCard';
import { listAllAgents } from '@/server/actions/agent';
import { listAllFunctions } from '@/server/actions/function';
import { listAllPackages } from '@/server/actions/package';
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
    <div className="overflow-auto bg-gray-bg w-full h-full">
      {isPending ? (
        <LoadingPlaceHolder />
      ) : isError ? (
        <EmptyPlaceHolder />
      ) : data && data.items.length > 0 ? (
        data.items.map(v => (
          <div className="float-left p-2" key={v.metadata.uid}>
            <ToolCard
              id={`${v.metadata.namespace}/${v.metadata.name}`}
              name={`${v.spec.displayName || v.metadata.name}`}
              description={v.spec.description}
              logo={v.spec.logo}
              type={module}
            />
          </div>
        ))
      ) : (
        <EmptyPlaceHolder />
      )}
    </div>
  );
}
