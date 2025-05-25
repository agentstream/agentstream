'use client';

import { Menu } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Props = {
  route: Record<string, string>;
};
const NavMenu = (props: Props) => {
  const pathname = usePathname();
  const items = Object.entries(props.route).map(([path, label]) => {
    return {
      key: path,
      label: (
        <Link
          href={{
            pathname: path
          }}
        >
          {label}
        </Link>
      )
    };
  });
  return (
    <Menu
      mode="vertical"
      selectedKeys={[pathname]}
      items={items}
      className="h-full text-center w-full"
    />
  );
};

export default NavMenu;
