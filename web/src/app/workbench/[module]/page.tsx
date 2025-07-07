'use client';

import { Module } from '@/common/enum';
import { FunctionSpec, PackageSpec, ResourceData } from '@/common/types';
import { parseResourceData } from '@/common/utils';
import CreateCard from '@/components/common/CreateCard';
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
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [module],
    queryFn: async () => (await fetchAction[module]())?.items ?? []
  });
  const logos = (
    useQuery({
      queryKey: [Module.Package],
      queryFn: fetchAction[Module.Package]
    }).data?.items ?? []
  )
    .map(item => {
      const { id, logo } = parseResourceData(item);
      return { [id]: logo };
    })
    .reduce((obj1, obj2) => ({ ...obj1, ...obj2 }), {});
  const enableCreate = [Module.Function, Module.Agent].includes(module);
  return (
    <div className="overflow-auto w-full h-full">
      {isPending ? (
        <LoadingPlaceHolder />
      ) : isError ? (
        <EmptyPlaceHolder />
      ) : (
        <div className="grid grid-cols-1 min-[660px]:grid-cols-2 min-[960px]:grid-cols-3 min-[1270px]:grid-cols-4 min-[1620px]:grid-cols-5 gap-2">
          {data?.length > 0
            ? data.map(v => {
                const info = parseResourceData(v as ResourceData<PackageSpec>);
                if (module === Module.Function) {
                  info.logo = logos[(v as ResourceData<FunctionSpec>).spec.package];
                }
                return <ToolCard info={info} type={module} refresh={refetch} key={info.id} />;
              })
            : null}
          {enableCreate ? <CreateCard type={module} /> : null}
        </div>
      )}
    </div>
  );
}
