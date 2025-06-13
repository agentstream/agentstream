'use client';

import { Module } from '@/common/enum';
import { parseResourceData } from '@/common/utils';
import DetailCard from '@/components/common/DetailCard';
import EmptyPlaceHolder from '@/components/common/EmptyPlaceHolder';
import ModuleCard from '@/components/common/ModuleCard';
import { useModule } from '@/hooks';
import { getAgentDetails } from '@/server/logics/agent';
import { getFunctionDetails } from '@/server/logics/function';
import { getPackageDetails } from '@/server/logics/package';
import { useQuery } from '@tanstack/react-query';
import { Space, Spin, Typography } from 'antd';
import { use } from 'react';

const fetchAction = {
  [Module.Package]: getPackageDetails,
  [Module.Function]: getFunctionDetails,
  [Module.Agent]: getAgentDetails
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [namespace, name] = decodeURIComponent(id).split('/');
  const mod = useModule();
  const { data, isPending, isError } = useQuery({
    queryKey: [mod, id],
    queryFn: () => fetchAction[mod](namespace, name)
  });
  return (
    <div className="overflow-auto w-full h-full">
      {isError ? (
        <EmptyPlaceHolder />
      ) : data ? (
        <Space direction="vertical">
          <DetailCard info={parseResourceData(data)} loading={isPending} />
          <Typography.Title level={3} className="m-0!">
            Modules {isPending ? <Spin /> : null}
          </Typography.Title>
          {!isPending ? (
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
          ) : null}
        </Space>
      ) : (
        <EmptyPlaceHolder />
      )}
    </div>
  );
}
