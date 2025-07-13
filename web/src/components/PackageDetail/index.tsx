'use client';

import { Module } from '@/common/enum';
import { useQuery } from '@tanstack/react-query';
import EmptyPlaceHolder from '../common/EmptyPlaceHolder';
import { Space, Spin, Typography } from 'antd';
import DetailCard from '../common/DetailCard';
import { noticeUnhandledError } from '@/common/utils';
import ModuleCard from '../common/ModuleCard';
import { PackageSpec, ResourceData } from '@/common/types';
import { getDetailsWithNotice, parseResourceData } from '@/common/logics';

type Props = {
  name: string;
  namespace: string;
};

const PackageDetail = (props: Props) => {
  const {
    data: resp,
    isPending,
    isError,
    error
  } = useQuery({
    queryKey: [Module.Package, props.namespace, props.name],
    queryFn: () => getDetailsWithNotice(Module.Package, props.namespace, props.name)
  });
  noticeUnhandledError(isError, error);
  const data = resp?.data as ResourceData<PackageSpec>;
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Space direction="vertical">
      <DetailCard
        info={{
          ...parseResourceData(data),
          image: data.spec.functionType.cloud.image
        }}
        loading={isPending}
      />
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
  );
};

export default PackageDetail;
