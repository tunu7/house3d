import { HOUSE } from "@/lib/architecture/house";
import { validateHouse } from "@/lib/architecture/validation";

const issues = validateHouse(HOUSE);
const icon = { error: "✗", warning: "!", info: "·" } as const;
for (const i of issues) console.log(`${icon[i.level]} [${i.check}] ${i.message}`);

const errors = issues.filter((i) => i.level === "error").length;
const warnings = issues.filter((i) => i.level === "warning").length;
console.log(`\n${errors} error(s), ${warnings} warning(s)`);
process.exit(errors > 0 ? 1 : 0);
