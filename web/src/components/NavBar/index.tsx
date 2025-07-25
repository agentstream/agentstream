'use client';

import { Space } from 'antd';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useWindowSize } from 'react-use';

const NavBar = () => {
  const { height } = useWindowSize();
  const [size, setSize] = useState(40);
  useEffect(() => {
    if (Number.isFinite(height)) {
      setSize(Number((Math.max(height / 12, 48) * 0.85).toFixed(3)));
    }
  }, [height]);
  return (
    <Space className="w-full h-full" align="center">
      <Image alt="logo" src="/logo.svg" width={size} height={size} className="ml-2" />
      <div className="text-blue-lv6 font-bold text-center" style={{ fontSize: size * 0.4 }}>
        AGENT STREAM
      </div>
    </Space>
  );
};

export default NavBar;
