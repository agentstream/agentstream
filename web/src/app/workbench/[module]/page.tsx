'use client';

import { Module } from '@/common/enum';
import { parseResourceData } from '@/common/logics';
import { FunctionSpec, PackageSpec, ResourceData } from '@/common/types';
import { canChange, noticeUnhandledError } from '@/common/utils';
import CreateCard from '@/components/common/CreateCard';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import LoadingPlaceHolder from '@/components/common/LoadingPlaceHolder';
import ToolCard from '@/components/common/ToolCard';
import { LogoContext, LogoContextProvider } from '@/contexts/LogoContext';
import { useResourceList } from '@/hooks';
import { use, useContext } from 'react';

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  const { data, isPending, isError, error, refetch } = useResourceList(module);
  noticeUnhandledError(isError, error);
  const logos = useContext(LogoContext);
  const list = data ?? [];
  const content = (
    <div className="grid grid-cols-1 min-[660px]:grid-cols-2 min-[960px]:grid-cols-3 min-[1270px]:grid-cols-4 min-[1620px]:grid-cols-5 gap-2">
      {list.length > 0
        ? list.map(v => {
            const info = parseResourceData(v as ResourceData<PackageSpec>);
            if (module === Module.Function) {
              const { name, namespace } = (v as ResourceData<FunctionSpec>).spec.packageRef;
              info.logo = logos[`${namespace}/${name}`] ?? '';
            }
            return <ToolCard info={info} type={module} refresh={refetch} key={info.id} />;
          })
        : null}
      {canChange(module) ? <CreateCard type={module} /> : null}
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
