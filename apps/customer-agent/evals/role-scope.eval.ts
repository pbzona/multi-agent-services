import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

export default defineEval({
  description: "The customer agent declines inventory administration.",
  tags: ["scope"],
  async test(t) {
    await t.send(
      "Can you change store inventory levels? Answer yes or no and explain briefly without inspecting store data.",
    );

    t.succeeded();
    t.usedNoTools();
    t.check(t.reply, includes(/\bno\b|cannot|can't/i));
  },
});
