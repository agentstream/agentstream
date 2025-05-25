'use client';

import { Module, TabItem } from '@/common/enum';
import Message from '@/components/Message';
import Metrics from '@/components/Metrics';
import Overview from '@/components/Overview';
import { Tabs } from 'antd';
import { use, useState } from 'react';

export default function Page({ params }: { params: Promise<{ module: Module }> }) {
  const { module } = use(params);
  const [activeKey, setKey] = useState(TabItem.Overview);
  const onChange = (key: string) => setKey(key as TabItem);
  return (
    <Tabs activeKey={activeKey} onChange={onChange} type="card" className="h-full">
      <Tabs.TabPane key={TabItem.Overview} tab="Overview" className="bg-gray-bg">
        <Overview module={module} />
      </Tabs.TabPane>
      <Tabs.TabPane key={TabItem.Message} tab="Message">
        <Message module={module} />
      </Tabs.TabPane>
      <Tabs.TabPane key={TabItem.Metrics} tab="Metrics">
        <Metrics module={module} />
      </Tabs.TabPane>
    </Tabs>
  );
}
