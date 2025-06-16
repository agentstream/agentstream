'use client';

type Props = {
  name: string;
  namespace: string;
};
const FunctionDetail = (props: Props) => {
  return (
    <div>
      <div>Name:{props.name}</div>
      <div>NameSpace:{props.namespace}</div>
    </div>
  );
};

export default FunctionDetail;
