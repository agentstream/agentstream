'use client';

import { Module } from '@/common/enum';
import { routePathOfOverviewPage } from '@/common/utils';
import { Button, Tabs } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DeleteButton from '../common/DeleteButton';
import AgentView from './AgentView';
import UnderDeveloping from '../common/UnderDeveloping';
import { useDeleteResource } from '@/hooks';

type Props = {
  name: string;
  namespace: string;
};

const AgentDetail = (props: Props) => {
  const [inEditing, setInEditing] = useState(false);
  const router = useRouter();
  const { mutate } = useDeleteResource(Module.Agent, () =>
    router.replace(routePathOfOverviewPage(Module.Agent))
  );
  async function handleDelete() {
    mutate(props);
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
          children: <UnderDeveloping />
        },
        {
          key: 'debug',
          label: 'Debug',
          children: <UnderDeveloping />
        }
      ]}
    />
  );
};

export default AgentDetail;
