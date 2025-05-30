'use client';

import { Module } from '@/common/enum';
import ToolCard from '../common/ToolCard';
import { listAllPackages } from '@/server/actions/package';
import { listAllFunctions } from '@/server/actions/function';
import { listAllAgents } from '@/server/actions/agent';
import { useQuery } from '@tanstack/react-query';
import { Empty, Spin } from 'antd';

type Props = {
  module: Module;
};

const fetchAction = {
  [Module.Package]: listAllPackages,
  [Module.Function]: listAllFunctions,
  [Module.Agent]: listAllAgents
};

const Overview = (props: Props) => {
  const { data, isPending, isError } = useQuery({
    queryKey: [props.module],
    queryFn: fetchAction[props.module]
  });
  return (
    <div className="overflow-hidden bg-gray-bg w-full h-full">
      {isPending ? (
        <div className="h-full flex flex-col justify-center">
          <Spin size="large" />
        </div>
      ) : isError ? (
        <div className="h-full flex flex-col justify-center">
          <Empty />
        </div>
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
        <div className="h-full flex flex-col justify-center">
          <Empty />
        </div>
      )}
    </div>
  );
};

export default Overview;
