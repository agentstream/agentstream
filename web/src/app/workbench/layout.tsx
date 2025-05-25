import { RoutePath } from '@/common/enum';
import NavBar from '@/components/NavBar';
import NavMenu from '@/components/NavMenu';

const routes = {
  [RoutePath.Package]: 'Package',
  [RoutePath.Function]: 'Function',
  [RoutePath.Agent]: 'Agent'
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
        <main className="w-full h-full overflow-auto">{children}</main>
      </main>
    </div>
  );
}
