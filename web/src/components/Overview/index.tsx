'use client';

import { Module } from '@/common/enum';
import ToolCard from '../common/ToolCard';

type Props = {
  module: Module;
};

const Overview = (props: Props) => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div className="overflow-hidden bg-gray-bg w-full h-full">
      {items.map((v, i) => (
        <div className="float-left p-2" key={i}>
          <ToolCard
            id={`default_${props.module}-${v}`}
            name={`${props.module}-${v}`}
            description="This is a description"
            logo="https://www.unitestream.com/img/logo-large.svg"
            type={props.module}
          />
        </div>
      ))}
    </div>
  );
};

export default Overview;
