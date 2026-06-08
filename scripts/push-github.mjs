/**
 * Push current branch to GitHub using GITHUB_TOKEN (never commit tokens).
 * Usage:
 *   set GITHUB_TOKEN=ghp_...   # needs public_repo; add workflow for CI push
 *   pnpm push:github
 * Optional: GITHUB_REPO=zonsequence01-ui/huhu
 */
import { spawnSync } from "node:child_process";

const token = process.env.GITHUB_TOKEN?.trim();
const repo = process.env.GITHUB_REPO ?? "zonsequence01-ui/huhu";
const branch = process.env.GITHUB_BRANCH ?? "main";

if (!token) {
  console.error("Set GITHUB_TOKEN (classic PAT with public_repo scope).");
  process.exit(1);
}

const remote = `https://x-access-token:${token}@github.com/${repo}.git`;
const push = spawnSync("git", ["push", remote, branch], {
  stdio: "inherit",
  encoding: "utf8",
});

process.exit(push.status ?? 1);
