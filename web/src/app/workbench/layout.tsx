'use client';

import { Module, RoutePath } from '@/common/enum';
import { routePathOfOverviewPage } from '@/common/utils';
import NavBar from '@/components/NavBar';
import NavMenu from '@/components/NavMenu';
import QueryContext from '@/contexts/QueryContext';
import { Splitter } from 'antd';
import { useWindowSize } from 'react-use';

const routes = {
  [RoutePath.WorkBench]: 'Dashboard',
  [routePathOfOverviewPage(Module.Package)]: 'Package',
  [routePathOfOverviewPage(Module.Function)]: 'Function',
  [routePathOfOverviewPage(Module.Agent)]: 'Agent'
};

export default function PageLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { height, width } = useWindowSize();
  const topbarHeight = Math.max(height / 12, 48).toFixed(3);
  const sidebarWidth = Math.max(width / 6, 120).toFixed(3);
  return (
    <Splitter layout="vertical" className="h-screen! w-screen!" onResize={() => {}}>
      <Splitter.Panel resizable={false} defaultSize={topbarHeight} size={topbarHeight}>
        <NavBar />
      </Splitter.Panel>
      <Splitter.Panel resizable={false}>
        <Splitter onResize={() => {}}>
          <Splitter.Panel resizable={false} defaultSize={sidebarWidth} size={sidebarWidth}>
            <NavMenu route={routes} />
          </Splitter.Panel>
          <Splitter.Panel
            resizable={false}
            className="w-full! h-full! overflow-auto p-5! bg-gray-bg"
          >
            <QueryContext>{children}</QueryContext>
          </Splitter.Panel>
        </Splitter>
      </Splitter.Panel>
    </Splitter>
  );
}
