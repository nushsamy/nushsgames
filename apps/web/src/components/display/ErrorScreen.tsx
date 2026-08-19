import { Link } from "react-router-dom";

interface ErrorScreenProps {
  message: string;
}

export function ErrorScreen({ message }: ErrorScreenProps) {
  return (
    <div className="text-center">
      <h1 className="text-5xl font-bold">Unable to load this bee</h1>
      <p className="mt-4 text-xl text-muted-foreground">{message}</p>
      <Link to="/display" className="mt-8 inline-block text-lg underline">
        Back to join
      </Link>
    </div>
  );
}
