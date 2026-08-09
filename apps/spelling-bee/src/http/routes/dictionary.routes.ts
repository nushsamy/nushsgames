import { Router } from "express";
import { requireAuth } from "../middleware/auth.ts";
import { getWordDefinition } from "../../services/dictionaryService.ts";
import { asString } from "../validate.ts";

export function createDictionaryRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/:word", async (req, res) => {
    const word = asString(req.params.word, "word");

    const result = await getWordDefinition(word);
    if (!result) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "No dictionary definition found" } });
      return;
    }
    res.status(200).json(result);
  });

  return router;
}
