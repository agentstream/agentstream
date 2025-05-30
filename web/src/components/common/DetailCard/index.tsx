'use client';

import { Image, Skeleton, Space } from 'antd';
import { useState } from 'react';

type Props = {
  id: string;
  name: string;
  description: string;
  logo: string;
  image: string;
};

const DetailCard = (props: Props) => {
  const [showPlaceHolder, setShowPlaceHolder] = useState(props.logo === '');
  function handleError() {
    setShowPlaceHolder(true);
    return false;
  }
  return (
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
  );
};

export default DetailCard;
