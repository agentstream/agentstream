'use client';

import { Card, Image, Skeleton, Space } from 'antd';
import { useState } from 'react';

type Props = {
  id: string;
  name: string;
  description: string;
  logo: string;
  image: string;
  loading: boolean;
};

const DetailCard = (props: Props) => {
  const [showPlaceHolder, setShowPlaceHolder] = useState(props.logo === '');
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
                src={props.logo}
                onError={handleError}
                preview={false}
                width={100}
                height={100}
              />
            )}
            <Space direction="vertical">
              <div>
                <b>Name</b>: {props.name}
              </div>
              <div>
                <b>ID</b>: {props.id}
              </div>
              <div>
                <b>Image</b>: {props.image}
              </div>
            </Space>
          </Space>
          <div>{props.description}</div>
        </Space>
      </Skeleton>
    </Card>
  );
};

export default DetailCard;
