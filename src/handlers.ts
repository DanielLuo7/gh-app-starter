import { createPRComment, createFileComment, getOctokit, getPullRequestDiff } from './utils.js';
import { checkForBugs, generateSummary } from "./llm.js"

const FIRST_LINE = 1;

export const handleWebhook = async (payload: any) => {
  // console.log('Received webhook:', payload);
  const octokit = await getOctokit(payload.installation.id);
  const pullNumber = payload.pull_request.number;
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name

  // add handling here, see utils.ts
  // get diff and files
  const { diff, files } = await getPullRequestDiff(octokit, owner, repo, pullNumber);
  let pullRequestSummary = "";
  // goal is to use llm to generate bugs and summaries for each file
  for (const file of files) {
    const filename = file.filename;
    const fileDiff = getFileDiffFromRaw(diff, filename);
    // if file has no diff either continue or error handle?
    if (!fileDiff) {
      console.error(`We have no diff for ${filename}. Going to continue on the rest`);
      continue;
    }
    // get bugs from fileDiff
    const bugComments = await checkForBugs(fileDiff);
    // write comments in line
    for ( const { line, body } of bugComments) {
      await createFileComment(octokit, owner, repo, pullNumber, filename, body, line);
    }

    // have it start with something like ## Summary for filename...
    const summary = await generateSummary(filename, fileDiff);
    // comment summary
    await createFileComment(octokit, owner, repo, pullNumber, filename, summary, FIRST_LINE);

    pullRequestSummary += `### Summary of changes for ${filename}\n${summary}\n\n`;
  }
  await createPRComment(octokit, owner, repo, pullNumber, `## PR Summary\n${pullRequestSummary}`)
};

// should return the matched diff if there is else null
function getFileDiffFromRaw(diff: any, filename: string): string | null {
  const pattern = new RegExp(`^diff --git a/${filename.replace(/\./g, '\\.')}.*?(?=^diff --git|\\Z)`, 'gms');
  const match = diff.match(pattern);
  return match ? match[0] : null;
}
