import { chatMain } from "./chat";
import { gameMain } from "./game";

window.addEventListener("DOMContentLoaded", () => {
  console.log("[WINDOW] Page loaded");
  main();
});

async function main() {
  await gameMain();
  await chatMain();
}
