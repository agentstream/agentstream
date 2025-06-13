'use client';

import { Module } from '@/common/enum';
import { ResourceInfo } from '@/common/types';
import { routePathOfDetailPage } from '@/common/utils';
import { QuestionCircleTwoTone } from '@ant-design/icons';
import { Avatar, Card, Space, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  info: ResourceInfo;
  type: Module;
};

const ToolCard = (props: Props) => {
  const [showPlaceHolder, setShowPlaceHolder] = useState(props.info.logo === '');
  function handleError() {
    setShowPlaceHolder(true);
    return false;
  }
  const router = useRouter();
  function handleClick() {
    router.push(routePathOfDetailPage(props.type, encodeURIComponent(props.info.id)));
  }
  return (
    <Card className="min-w-64 h-40 hover:cursor-pointer" variant="borderless" onClick={handleClick}>
      <Space direction="vertical">
        <Card.Meta
          avatar={
            <Avatar
              src={showPlaceHolder ? undefined : props.info.logo}
              shape="square"
              size={60}
              icon={<QuestionCircleTwoTone />}
              onError={handleError}
            />
          }
          title={
            <Typography.Title level={5} ellipsis={true} className="w-40 m-0!">
              {props.info.name}
            </Typography.Title>
          }
          description={
            <Typography.Paragraph ellipsis={true} className="w-40 m-0!">
              {props.info.id}
            </Typography.Paragraph>
          }
        />
        <Typography.Paragraph
          ellipsis={{
            rows: 3
          }}
          className="w-53 max-h-18"
        >
          {props.info.description}
        </Typography.Paragraph>
      </Space>
    </Card>
  );
};

export default ToolCard;
