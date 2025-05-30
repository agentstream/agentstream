import { Module } from '@/common/enum';
import { routePathOfModuleOverview } from '@/common/utils';
import NavBar from '@/components/NavBar';
import NavMenu from '@/components/NavMenu';
import QueryContext from '@/contexts/QueryContext';

const routes = {
  [routePathOfModuleOverview(Module.Package)]: 'Package',
  [routePathOfModuleOverview(Module.Function)]: 'Function',
  [routePathOfModuleOverview(Module.Agent)]: 'Agent'
};

export default function PageLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-screen h-screen">
      <header className="w-full h-1/12 min-h-12">
        <NavBar />
      </header>
      <main className="w-full h-11/12 flex">
        <aside className="h-full w-1/6 min-w-25">
          <NavMenu route={routes} />
        </aside>
        <main className="w-full h-full overflow-auto">
          <QueryContext>{children}</QueryContext>
        </main>
      </main>
    </div>
  );
}
