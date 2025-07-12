'use client';

import { Module } from '@/common/enum';
import { FunctionSpec, PackageSpec, ResourceData, ResourceList } from '@/common/types';
import { isRequestSuccess, parseResourceData } from '@/common/utils';
import CreateCard from '@/components/common/CreateCard';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import LoadingPlaceHolder from '@/components/common/LoadingPlaceHolder';
import ToolCard from '@/components/common/ToolCard';
import { LogoContext, LogoContextProvider } from '@/contexts/LogoContext';
import { listAllAgents } from '@/server/logics/agent';
import { listAllFunctions } from '@/server/logics/function';
import { listAllPackages } from '@/server/logics/package';
import { RobotOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { use, useContext } from 'react';

const fetchAction = {
  [Module.Package]: listAllPackages,
  [Module.Function]: listAllFunctions,
  [Module.Agent]: listAllAgents
};

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [module],
    queryFn: async () => {
      const resp = await fetchAction[module]();
      if (!isRequestSuccess(resp)) {
        throw resp.data;
      }
      return (resp.data as ResourceList<unknown>).items ?? [];
    }
  });
  const logos = useContext(LogoContext);
  const enableCreate = [Module.Function, Module.Agent].includes(module);
  const list = data ?? [];
  const content = (
    <div className="grid grid-cols-1 min-[660px]:grid-cols-2 min-[960px]:grid-cols-3 min-[1270px]:grid-cols-4 min-[1620px]:grid-cols-5 gap-2">
      {list.length > 0
        ? list.map(v => {
            const info = parseResourceData(v as ResourceData<PackageSpec>);
            if (module === Module.Function) {
              info.logo = logos[(v as ResourceData<FunctionSpec>).spec.package] ?? '';
            }
            return (
              <ToolCard
                info={info}
                type={module}
                refresh={refetch}
                key={info.id}
                icon={
                  module === Module.Agent ? (
                    <RobotOutlined className="text-blue-lv6! bg-white! w-full! h-full! flex justify-center" />
                  ) : undefined
                }
              />
            );
          })
        : null}
      {enableCreate ? <CreateCard type={module} /> : null}
    </div>
  );
  return (
    <div className="overflow-auto w-full h-full">
      {isPending ? (
        <LoadingPlaceHolder />
      ) : isError ? (
        <EmptyPlaceHolder />
      ) : module === Module.Function ? (
        <LogoContextProvider>{content}</LogoContextProvider>
      ) : (
        content
      )}
    </div>
  );
}
