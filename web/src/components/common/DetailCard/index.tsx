'use client';

import { ResourceInfo } from '@/common/types';
import { Card, Image, Skeleton, Space } from 'antd';
import { useState } from 'react';

type Props = {
  info: ResourceInfo;
  loading: boolean;
};

const DetailCard = (props: Props) => {
  const [showPlaceHolder, setShowPlaceHolder] = useState(props.info.logo === '');
  function handleError() {
    setShowPlaceHolder(true);
    return false;
  }
  return (
    <Card className="w-100">
      <Skeleton loading={props.loading} active={true}>
        <Space direction="vertical" size="large">
          <Space size="large">
            {showPlaceHolder ? (
              <Skeleton.Image />
            ) : (
              <Image
                alt="logo"
                src={props.info.logo}
                onError={handleError}
                preview={false}
                width={100}
                height={100}
              />
            )}
            <Space direction="vertical">
              <div>
                <b>Name</b>: {props.info.name}
              </div>
              <div>
                <b>ID</b>: {props.info.id}
              </div>
              <div>
                <b>Image</b>: {props.info.image}
              </div>
            </Space>
          </Space>
          <div>{props.info.description}</div>
        </Space>
      </Skeleton>
    </Card>
  );
};

export default DetailCard;
