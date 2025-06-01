'use client';

import { Module } from '@/common/enum';
import { routePathOfDetailPage } from '@/common/utils';
import { QuestionCircleTwoTone } from '@ant-design/icons';
import { Avatar, Card, Space, Typography } from 'antd';
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
  const [showPlaceHolder, setShowPlaceHolder] = useState(props.logo === '');
  function handleError() {
    setShowPlaceHolder(true);
    return false;
  }
  const router = useRouter();
  function handleClick() {
    router.push(routePathOfDetailPage(props.type, encodeURIComponent(props.id)));
  }
  return (
    <Card
      className=" w-[16vw] min-w-64 h-40 hover:cursor-pointer"
      variant="borderless"
      onClick={handleClick}
    >
      <Space direction="vertical">
        <Card.Meta
          avatar={
            <Avatar
              src={showPlaceHolder ? undefined : props.logo}
              shape="square"
              size="large"
              icon={<QuestionCircleTwoTone />}
              onError={handleError}
            />
          }
          title={
            <Typography.Title level={5} ellipsis={true} className="w-40 m-0!">
              {props.name}
            </Typography.Title>
          }
          description={
            <Typography.Paragraph ellipsis={true} className="w-40 m-0!">
              {props.id}
            </Typography.Paragraph>
          }
        />
        <Typography.Paragraph
          ellipsis={{
            rows: 3
          }}
          className="w-53 max-h-18"
        >
          {props.description}
        </Typography.Paragraph>
      </Space>
    </Card>
  );
};

export default ToolCard;
