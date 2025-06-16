'use client';

import { Module } from '@/common/enum';
import { ResourceInfo } from '@/common/types';
import { codeBlockInMarkdown, routePathOfDetailPage } from '@/common/utils';
import { deleteFunction } from '@/server/logics/function';
import Icon, { DeleteOutlined, QuestionCircleTwoTone } from '@ant-design/icons';
import { Avatar, Card, notification, Popconfirm, Space, Typography } from 'antd';
import { StatusCodes } from 'http-status-codes';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import '@ant-design/v5-patch-for-react-19';

type Props = {
  info: ResourceInfo;
  type: Module;
  refresh: () => void;
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
  async function handleDelete() {
    const [namespace, name] = props.info.id.split('/');
    const resp = await deleteFunction(name, namespace);
    if (resp.code === StatusCodes.NO_CONTENT) {
      notification.success({
        message: 'Delete Success!',
        placement: 'top'
      });
    } else {
      notification.error({
        message: 'Delete failed!',
        description: (
          <MarkdownPreview
            source={codeBlockInMarkdown('json', JSON.stringify(resp.data, null, 2))}
          />
        ),
        placement: 'top'
      });
    }
    props.refresh();
  }
  return (
    <Card className="min-w-64 h-40" variant="borderless">
      <Space direction="vertical" onClick={handleClick} className="hover:cursor-pointer">
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
      {props.type === Module.Function ? (
        <Popconfirm
          title={`Delete this ${props.type}`}
          description={`Are you sure to delete this ${props.type}?`}
          onConfirm={handleDelete}
        >
          <Icon
            component={DeleteOutlined}
            className="text-2xl absolute bottom-2 right-2 hover:cursor-pointer hover:text-blue-lv6!"
          />
        </Popconfirm>
      ) : null}
    </Card>
  );
};

export default ToolCard;
