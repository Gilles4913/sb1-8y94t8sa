export default async function handler(req, res) {
  res.status(200).json({
    vercel_git_repo_owner: process.env.VERCEL_GIT_REPO_OWNER,
    vercel_git_repo_slug: process.env.VERCEL_GIT_REPO_SLUG,
    vercel_git_commit_ref: process.env.VERCEL_GIT_COMMIT_REF,
    vercel_git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA,
    vercel_url: process.env.VERCEL_URL,
    node: process.version
  });
}
