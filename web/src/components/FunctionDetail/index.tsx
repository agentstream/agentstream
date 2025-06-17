'use client';

import { Module } from '@/common/enum';
import { getFunctionDetails } from '@/server/logics/function';
import { useQuery } from '@tanstack/react-query';
import { Button, Descriptions, Skeleton, Space, Tag } from 'antd';
import EmptyPlaceHolder from '../common/EmptyPlaceHolder';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { codeBlockInMarkdown, routePathOfOverviewPage } from '@/common/utils';
import '@ant-design/v5-patch-for-react-19';
import DeleteButton from '../common/DeleteButton';
import { redirect, RedirectType } from 'next/navigation';
import { deleteFunctionInteraction } from '@/common/logics';

type Props = {
  name: string;
  namespace: string;
};
const FunctionDetail = (props: Props) => {
  const { data, isPending, isError } = useQuery({
    queryKey: [Module.Function, props.namespace, props.name],
    queryFn: () => getFunctionDetails(props.namespace, props.name)
  });
  async function handleDelete() {
    await deleteFunctionInteraction(props.name, props.namespace);
    redirect(routePathOfOverviewPage(Module.Function), RedirectType.replace);
  }
  return isError || !data ? (
    <EmptyPlaceHolder />
  ) : (
    <Space direction="vertical" align="end">
      <Descriptions
        bordered
        items={[
          {
            key: 'name',
            label: 'Name',
            children: isPending ? <Skeleton.Input /> : data.spec.displayName || data.metadata.name
          },
          {
            key: 'description',
            label: 'Description',
            children: isPending ? <Skeleton.Input /> : data.spec.description
          },
          {
            key: 'package',
            label: 'Package',
            children: isPending ? <Skeleton.Input /> : data.spec.package
          },
          {
            key: 'module',
            label: 'Module',
            children: isPending ? <Skeleton.Input /> : data.spec.module
          },
          {
            key: 'sources',
            label: 'Sources',
            children: isPending ? (
              <Skeleton.Input />
            ) : (
              data.spec.sources.map(item => {
                const {
                  pulsar: { topic }
                } = item;
                return (
                  <Tag key={topic} color="blue">
                    {topic}
                  </Tag>
                );
              })
            )
          },
          {
            key: 'sink',
            label: 'Sink',
            children: isPending ? (
              <Skeleton.Input />
            ) : (
              <Tag color="blue">{data.spec.sink.pulsar.topic}</Tag>
            )
          },
          {
            key: 'configs',
            label: 'Configs',
            children: isPending ? (
              <Skeleton.Input />
            ) : (
              <MarkdownPreview
                source={codeBlockInMarkdown('json', JSON.stringify(data.spec.config, null, 2))}
              />
            )
          }
        ]}
      />
      <DeleteButton type={Module.Function} action={handleDelete}>
        <Button type="primary">Delete</Button>
      </DeleteButton>
    </Space>
  );
};

export default FunctionDetail;
