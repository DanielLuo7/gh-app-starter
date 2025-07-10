import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

interface PullRequestDiff {
  diff: any;
  files: Array<{
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
}

interface PullRequestFile {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
}

// Initialize Octokit with app authentication
export const getOctokit = async (installationId: string): Promise<Octokit> => {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_PRIVATE_KEY!,
    installationId,
  });

  const { token } = await auth({ type: 'installation' });
  return new Octokit({ auth: token });
};

// Get the full diff of a pull request
export const getPullRequestDiff = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<PullRequestDiff> => {
  // Get PR details
  const { data: pullRequest } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  // Get PR diff
  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: {
      format: 'diff',
    },
  });

  // Get PR files
  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return {
    diff: diff,
    files: files.map((file: PullRequestFile) => ({
      filename: file.filename,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
    })),
  };
};

// Post a review on a pull request
export const postReview = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT'
): Promise<void> => {
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event,
  });
};

// Helper function to create a review with inline comments
export const postReviewWithComments = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  comments: Array<{
    path: string;
    position: number;
    body: string;
  }>,
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT' = 'COMMENT'
): Promise<void> => {
  await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event,
    comments,
  });
};

export const createFileComment = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number,
  path: string,
  body: string,
  line: number,
) => {
  await octokit.rest.pulls.createReviewComment({
    owner,
    repo,
    pull_number,
    body,
    commit_id: (await octokit.rest.pulls.get({ owner, repo, pull_number })).data.head.sha,
    path,
    line,
    side: "RIGHT",
  });
};

export const createPRComment = async (
  octokit: Octokit,
  owner: string,
  repo: string,
  issue_number: number,
  body: string
) => {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  })
}
