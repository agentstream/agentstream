'use client';

import { Empty } from 'antd';

const EmptyPlaceHolder = () => {
  return (
    <div className="h-full w-full flex flex-col justify-center">
      <Empty />
    </div>
  );
};

export default EmptyPlaceHolder;
