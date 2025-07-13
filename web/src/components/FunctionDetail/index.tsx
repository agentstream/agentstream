'use client';

import { Button, Tabs } from 'antd';
import FunctionView from './FunctionView';
import DeleteButton from '../common/DeleteButton';
import { Module } from '@/common/enum';
import { routePathOfOverviewPage } from '@/common/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import UnderDeveloping from '../common/UnderDeveloping';
import { useDeleteResource } from '@/hooks';

type Props = {
  name: string;
  namespace: string;
};

const FunctionDetail = (props: Props) => {
  const [inEditing, setInEditing] = useState(false);
  const router = useRouter();
  const { mutate } = useDeleteResource(Module.Function, () =>
    router.replace(routePathOfOverviewPage(Module.Function))
  );
  async function handleDelete() {
    mutate(props);
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
