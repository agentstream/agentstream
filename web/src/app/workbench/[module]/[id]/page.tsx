'use client';

import { Module } from '@/common/enum';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import { usePath } from '@/hooks';
import { getAgentDetails } from '@/server/actions/agent';
import { getFunctionDetails } from '@/server/actions/function';
import { getPackageDetails } from '@/server/actions/package';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from 'antd';
import { use } from 'react';

const fetchAction = {
  [Module.Package]: getPackageDetails,
  [Module.Function]: getFunctionDetails,
  [Module.Agent]: getAgentDetails
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [namespace, name] = decodeURIComponent(id).split('/');
  const mod = usePath(2) as Module;
  console.log(mod);
  const { data, isPending, isError } = useQuery({
    queryKey: [mod, id],
    queryFn: () => fetchAction[mod](namespace, name)
  });
  return (
    <div className="w-full p-5">
      {isPending ? (
        <Skeleton active={true} />
      ) : isError ? (
        <EmptyPlaceHolder />
      ) : data ? (
        <div></div>
      ) : (
        <EmptyPlaceHolder />
      )}
    </div>
  );
}
