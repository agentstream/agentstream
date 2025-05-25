'use client';

import { Card, Image } from 'antd';

type Props = {
  name: string;
  description: string;
  logo: string;
};
const ToolCard = (props: Props) => {
  return (
    <Card
      cover={
        <div className="px-5 pt-5 h-20">
          <Image alt="logo" src={props.logo} preview={false} />
        </div>
      }
      className="w-63 h-42"
      variant="borderless"
    >
      <Card.Meta title={props.name} description={props.description} />
    </Card>
  );
};
export default ToolCard;
