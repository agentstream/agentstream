'use client';

import { Module } from '@/common/enum';
import { deleteAgentInteraction } from '@/common/logics';
import { routePathOfOverviewPage } from '@/common/utils';
import { Button, Tabs } from 'antd';
import { redirect, RedirectType } from 'next/navigation';
import { useState } from 'react';
import DeleteButton from '../common/DeleteButton';
import AgentView from './AgentView';

type Props = {
  name: string;
  namespace: string;
};

const AgentDetail = (props: Props) => {
  const [inEditing, setInEditing] = useState(false);
  async function handleDelete() {
    await deleteAgentInteraction(props.name, props.namespace);
    redirect(routePathOfOverviewPage(Module.Agent), RedirectType.replace);
  }
  return (
    <Tabs
      defaultActiveKey="config"
      tabBarExtraContent={
        <DeleteButton type={Module.Agent} action={handleDelete}>
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
            <AgentView
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
          children: 'Token costs'
        },
        {
          key: 'debug',
          label: 'Debug',
          children: 'Agent Function API'
        }
      ]}
    />
  );
};

export default AgentDetail;
