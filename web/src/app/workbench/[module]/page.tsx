export default function Page({ params }: { params: { module: string } }) {
  const { module } = params;
  return <div>{module}</div>;
}
