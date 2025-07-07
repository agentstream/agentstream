'use client';

type Props = {
  name: string;
  namespace: string;
  inEditing: boolean;
  setInEditing: (inEditing: boolean) => void;
};

const AgentView = (props: Props) => {
  return <div>Basic Configuration</div>;
};

export default AgentView;
