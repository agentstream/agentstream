'use client';

import { Spin } from 'antd';

const LoadingPlaceHolder = () => {
  return (
    <div className="h-full w-full flex flex-col justify-center">
      <Spin size="large" />
    </div>
  );
};

export default LoadingPlaceHolder;
