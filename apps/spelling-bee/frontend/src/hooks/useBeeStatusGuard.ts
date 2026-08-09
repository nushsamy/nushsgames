import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { SpellingBee } from "@/api/types";

/** Redirects away from /builder or /control when the bee's status doesn't match the page, or the bee doesn't exist. */
export function useBeeStatusGuard(
  bee: SpellingBee | null,
  notFound: boolean,
  loading: boolean,
  page: "builder" | "control",
): void {
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (notFound) {
      toast.error("Bee not found");
      navigate("/host/bees", { replace: true });
      return;
    }
    if (!bee) return;
    if (page === "control" && bee.status === "created") {
      navigate(`/host/${bee.id}/builder`, { replace: true });
    } else if (page === "builder" && bee.status !== "created") {
      navigate(`/host/${bee.id}/control`, { replace: true });
    }
  }, [bee, notFound, loading, page, navigate]);
}
