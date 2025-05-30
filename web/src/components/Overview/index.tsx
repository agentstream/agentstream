'use client';

import { Module } from '@/common/enum';
import ToolCard from '../common/ToolCard';
import { listAllPackages } from '@/server/actions/package';
import { listAllFunctions } from '@/server/actions/function';
import { listAllAgents } from '@/server/actions/agent';
import { useQuery } from '@tanstack/react-query';
import { useContext } from 'react';
import { ModuleContext } from '@/contexts/ModuleContext';
import EmptyPlaceHolder from '../common/EmptyPlaceHolder';
import LoadingPlaceHolder from '../common/LoadingPlaceHolder';

const fetchAction = {
  [Module.Package]: listAllPackages,
  [Module.Function]: listAllFunctions,
  [Module.Agent]: listAllAgents
};

const Overview = () => {
  const mod = useContext(ModuleContext);
  const { data, isPending, isError } = useQuery({
    queryKey: [mod],
    queryFn: fetchAction[mod]
  });
  return (
    <div className="overflow-hidden bg-gray-bg w-full h-full">
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
              type={v.kind.toLowerCase() as Module}
            />
          </div>
        ))
      ) : (
        <EmptyPlaceHolder />
      )}
    </div>
  );
};

export default Overview;
