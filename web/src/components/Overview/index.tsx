'use client';

import { Module } from '@/common/enum';

type Props = {
  module: Module;
};

const Overview = (props: Props) => {
  return <div>{props.module}-overview</div>;
};

export default Overview;
