import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export function LandingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/host/bees" replace />;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 text-foreground">
      <div className="flex w-full max-w-3xl flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Spelling Bee</h1>
          <p className="mt-2 text-muted-foreground">Host a live spelling bee, or watch one in progress.</p>
        </div>
        <div className="grid w-full gap-6 sm:grid-cols-2">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => navigate("/auth/login")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") navigate("/auth/login");
            }}
            className="cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Host Login</CardTitle>
              <CardDescription>Sign in to create and manage your spelling bees.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Log in
              </Button>
            </CardContent>
          </Card>

          <Card
            role="button"
            tabIndex={0}
            onClick={() => navigate("/display")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") navigate("/display");
            }}
            className="cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Watch a Bee</CardTitle>
              <CardDescription>Enter a game key to follow along live.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" variant="outline">
                Enter game key
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
