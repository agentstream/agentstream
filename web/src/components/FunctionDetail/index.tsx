'use client';

import { Button, Tabs } from 'antd';
import FunctionView from './FunctionView';
import DeleteButton from '../common/DeleteButton';
import { Module } from '@/common/enum';
import { deleteFunctionInteraction } from '@/common/logics';
import { routePathOfOverviewPage } from '@/common/utils';
import { redirect, RedirectType } from 'next/navigation';

type Props = {
  name: string;
  namespace: string;
};

const FunctionDetail = (props: Props) => {
  async function handleDelete() {
    await deleteFunctionInteraction(props.name, props.namespace);
    redirect(routePathOfOverviewPage(Module.Function), RedirectType.replace);
  }
  return (
    <Tabs
      defaultActiveKey="config"
      tabBarExtraContent={
        <DeleteButton type={Module.Function} action={handleDelete}>
          <Button type="primary">Delete</Button>
        </DeleteButton>
      }
      items={[
        {
          key: 'config',
          label: 'Configuration',
          children: <FunctionView name={props.name} namespace={props.namespace} />
        },
        {
          key: 'metrics',
          label: 'Metrics',
          children: 'Prometheus'
        },
        {
          key: 'messages',
          label: 'Messages',
          children: 'Pulsar Admin API'
        },
        {
          key: 'logs',
          label: 'Logs',
          children: 'K8S SDK Pod logs'
        }
      ]}
    />
  );
};

export default FunctionDetail;
