'use client';

import { Module } from '@/common/enum';
import { routePathOfCreatePage } from '@/common/utils';
import Icon, { PlusSquareOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import { useRouter } from 'next/navigation';

type Props = {
  type: Module;
};
const CreateCard = (props: Props) => {
  const router = useRouter();
  function handleClick() {
    router.push(routePathOfCreatePage(props.type));
  }
  return (
    <Card
      className="min-w-64 h-40 border-blue-lv6! border-2! text-blue-lv6! hover:border-0! hover:cursor-pointer hover:bg-blue-lv6! hover:text-white!"
      onClick={handleClick}
    >
      <Icon
        component={PlusSquareOutlined}
        className="text-6xl w-full h-28 flex justify-center align-middle "
      />
    </Card>
  );
};
export default CreateCard;
