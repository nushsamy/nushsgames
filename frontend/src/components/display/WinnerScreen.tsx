interface WinnerScreenProps {
  name: string;
}

export function WinnerScreen({ name }: WinnerScreenProps) {
  return (
    <div className="text-center">
      <p className="text-proj-verdict">🎉</p>
      <h1 className="mt-4 text-proj-round font-extrabold text-warning">Winner: {name}</h1>
      <p className="mt-4 text-proj-verdict">🎉</p>
    </div>
  );
}
