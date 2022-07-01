import fs from "fs";
import path from "path";

export default function gitCommitHash() {
  if (!fs.existsSync(".git/HEAD")) return "NOT_GIT_REPO";
  const match = /ref: (\S+)/.exec(fs.readFileSync(".git/HEAD", "utf8"));
  return match ? fs.readFileSync(path.join(".git", match[1]), "utf8").trim() : "NOT_GIT_REPO";
}
