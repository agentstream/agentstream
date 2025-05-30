'use client';

import { Module } from '@/common/enum';
import { routePathOfDetailPage } from '@/common/utils';
import { QuestionCircleTwoTone } from '@ant-design/icons';
import { Avatar, Card, Space } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  id: string;
  name: string;
  description: string;
  logo: string;
  type: Module;
};

const ToolCard = (props: Props) => {
  const [showIcon, setShowIcon] = useState(props.logo === '');
  function handleError() {
    setShowIcon(true);
    return false;
  }
  const router = useRouter();
  function handleClick() {
    router.push(routePathOfDetailPage(props.type, encodeURIComponent(props.id)));
  }
  return (
    <Card className="w-65 h-35" variant="borderless">
      <Space direction="vertical">
        <Card.Meta
          avatar={
            <Avatar
              src={showIcon ? undefined : props.logo}
              shape="square"
              size="large"
              icon={<QuestionCircleTwoTone />}
              onError={handleError}
              onClick={handleClick}
              className="hover:cursor-pointer"
            />
          }
          title={props.name}
          description={props.id}
        />
        {props.description}
      </Space>
    </Card>
  );
};

export default ToolCard;
