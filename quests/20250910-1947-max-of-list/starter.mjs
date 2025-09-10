import fs from "node:fs";
const s=fs.readFileSync(0,"utf8").trim().split(/s+/).map(Number);
console.log(Math.max(...s));
