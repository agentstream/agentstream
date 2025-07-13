'use client';

import { routePathOfOverviewPage } from '@/common/utils';
import { useModule } from '@/hooks';
import { Menu } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  route: Record<string, string>;
};

const NavMenu = (props: Props) => {
  const mod = useModule();
  const pathname = usePathname();
  const key = mod ? routePathOfOverviewPage(mod) : pathname;
  const items = Object.entries(props.route).map(([path, label]) => {
    return {
      key: path,
      label: <Link href={{ pathname: path }}>{label}</Link>
    };
  });
  return (
    <Menu
      mode="vertical"
      selectedKeys={[key]}
      items={items}
      className="h-full text-center w-full"
    />
  );
};

export default NavMenu;
