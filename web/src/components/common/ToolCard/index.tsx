'use client';

import { Module } from '@/common/enum';
import { ResourceInfo } from '@/common/types';
import { routePathOfDetailPage } from '@/common/utils';
import Icon, { DeleteOutlined, QuestionCircleTwoTone, RobotOutlined } from '@ant-design/icons';
import { Avatar, Card, Space, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import DeleteButton from '../DeleteButton';
import { useDeleteResource } from '@/hooks';

type Props = {
  info: ResourceInfo;
  type: Module;
  refresh: () => void;
  icon?: ReactNode;
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
  const { mutate } = useDeleteResource(props.type, props.refresh);
  async function handleDelete() {
    const [namespace, name] = props.info.id.split('/');
    mutate({ namespace, name });
  }
  return (
    <Card className="min-w-64 h-40" variant="borderless">
      <Space direction="vertical" onClick={handleClick} className="hover:cursor-pointer">
        <Card.Meta
          avatar={
            <Avatar
              src={showPlaceHolder ? undefined : props.info.logo || null}
              shape="square"
              size={60}
              icon={
                props.icon ??
                (props.type === Module.Agent ? (
                  <RobotOutlined className="text-blue-lv6! bg-white! w-full! h-full! flex justify-center" />
                ) : (
                  <QuestionCircleTwoTone className="text-blue-lv6! bg-white! w-full! h-full! flex justify-center" />
                ))
              }
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
      {[Module.Function, Module.Agent].includes(props.type) ? (
        <DeleteButton
          type={props.type}
          action={handleDelete}
          display={
            <Icon
              component={DeleteOutlined}
              className="text-2xl absolute bottom-2 right-2 hover:cursor-pointer hover:text-blue-lv6!"
            />
          }
        />
      ) : null}
    </Card>
  );
};

export default ToolCard;
