'use client';

import { RoutePath } from '@/common/enum';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import { usePathname, useRouter } from 'next/navigation';
const UnderDeveloping = () => {
  const router = useRouter();
  const pathname = usePathname();
  function handleClick() {
    if (pathname === RoutePath.WorkBench) {
      alert('Here is the HomePage.');
    } else {
      router.back();
    }
  }
  return (
    <div className="h-full w-full flex flex-col justify-center">
      <Empty
        image={<ClockCircleOutlined />}
        description={
          <div className="text-2xl">
            This page is still under developing...
            <br />
            <div
              className="text-black hover:text-blue-lv6 hover:cursor-pointer"
              onClick={handleClick}
            >
              Click here to turn back
            </div>
          </div>
        }
        style={{ fontSize: 50 }}
      />
    </div>
  );
};

export default UnderDeveloping;
