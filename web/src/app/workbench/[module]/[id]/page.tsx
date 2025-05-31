'use client';

import { Module } from '@/common/enum';
import DetailCard from '@/components/common/DetailCard';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import ModuleCard from '@/components/common/ModuleCard';
import { getAgentDetails } from '@/server/actions/agent';
import { getFunctionDetails } from '@/server/actions/function';
import { getPackageDetails } from '@/server/actions/package';
import { useQuery } from '@tanstack/react-query';
import { Skeleton, Space, Typography } from 'antd';
import { usePathname } from 'next/navigation';
import { use } from 'react';

const fetchAction = {
  [Module.Package]: getPackageDetails,
  [Module.Function]: getFunctionDetails,
  [Module.Agent]: getAgentDetails
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [namespace, name] = decodeURIComponent(id).split('/');
  const mod = usePathname().split('/')[2] as Module;
  const { data, isPending, isError } = useQuery({
    queryKey: [mod, id],
    queryFn: () => fetchAction[mod](namespace, name)
  });
  return (
    <div className="overflow-auto w-full h-full">
      {isPending ? (
        <Skeleton active={true} />
      ) : isError ? (
        <EmptyPlaceHolder />
      ) : data ? (
        <Space direction="vertical">
          <DetailCard
            id={`${data.metadata.namespace}/${data.metadata.name}`}
            name={`${data.spec.displayName || data.metadata.name}`}
            description={data.spec.description}
            logo={data.spec.logo}
            image={data.spec.functionType.cloud.image}
          />
          <Typography.Title level={3} className="m-0!">
            Modules
          </Typography.Title>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.spec.modules).map(([k, v]) => (
              <div key={k}>
                <ModuleCard
                  name={v.displayName}
                  description={v.description}
                  sourceSchema={v.sourceSchema}
                  sinkSchema={v.sinkSchema}
                />
              </div>
            ))}
          </div>
        </Space>
      ) : (
        <EmptyPlaceHolder />
      )}
    </div>
  );
}
