'use client';

import { Button, Tabs } from 'antd';
import FunctionView from './FunctionView';
import DeleteButton from '../common/DeleteButton';
import { Module } from '@/common/enum';
import { deleteFunctionInteraction } from '@/common/logics';
import { routePathOfOverviewPage } from '@/common/utils';
import { redirect, RedirectType } from 'next/navigation';
import { useState } from 'react';
import UnderDeveloping from '../common/UnderDeveloping';

type Props = {
  name: string;
  namespace: string;
};

const FunctionDetail = (props: Props) => {
  const [inEditing, setInEditing] = useState(false);
  async function handleDelete() {
    await deleteFunctionInteraction(props.name, props.namespace);
    redirect(routePathOfOverviewPage(Module.Function), RedirectType.replace);
  }
  return (
    <Tabs
      defaultActiveKey="config"
      tabBarExtraContent={
        <DeleteButton type={Module.Function} action={handleDelete}>
          <Button type="primary" disabled={inEditing}>
            Delete
          </Button>
        </DeleteButton>
      }
      items={[
        {
          key: 'config',
          label: 'Configuration',
          children: (
            <FunctionView
              name={props.name}
              namespace={props.namespace}
              inEditing={inEditing}
              setInEditing={setInEditing}
            />
          )
        },
        {
          key: 'metrics',
          label: 'Metrics',
          children: <UnderDeveloping />
        },
        {
          key: 'messages',
          label: 'Messages',
          children: <UnderDeveloping />
        },
        {
          key: 'logs',
          label: 'Logs',
          children: <UnderDeveloping />
        }
      ]}
    />
  );
};

export default FunctionDetail;
