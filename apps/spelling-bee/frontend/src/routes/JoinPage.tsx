import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getGamekeyState } from "@/api/gamekey";
import { ApiError } from "@/api/httpClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Maps a gamekey's prefix (the part before the first "-") to the route for that game
 * type's display client. Only spelling bee exists today; new game types register their
 * prefix here rather than needing a new join flow.
 */
const GAME_KEY_ROUTES: Record<string, (gamekey: string) => string> = {
  BEE: (gamekey) => `/display/${gamekey}`,
};

function resolveGameKeyRoute(gamekey: string): string | null {
  const prefix = gamekey.split("-")[0];
  const resolver = GAME_KEY_ROUTES[prefix];
  return resolver ? resolver(gamekey) : null;
}

export function JoinPage() {
  const navigate = useNavigate();
  const [gamekey, setGamekey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = gamekey.trim();
    if (!trimmed) return;

    const route = resolveGameKeyRoute(trimmed);
    if (!route) {
      setError("Unrecognized game key. Please check and try again.");
      return;
    }

    setIsJoining(true);
    setError(null);
    try {
      await getGamekeyState(trimmed);
      navigate(route);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 404
          ? "Invalid game key. Please try again."
          : "Could not reach the server. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Enter Game Key</CardTitle>
          <CardDescription>Join a game to watch it live on this screen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gamekey" className="sr-only">
                Game key
              </Label>
              <Input
                id="gamekey"
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="BEE-A7F2K9"
                value={gamekey}
                onChange={(event) => setGamekey(event.target.value.toUpperCase())}
                aria-invalid={error !== null}
                className="h-14 text-center text-2xl tracking-widest"
              />
              {error && <p className="text-center text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" size="lg" disabled={isJoining || !gamekey.trim()} className="h-12 text-lg">
              {isJoining ? "Joining…" : "Join"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
