import { getOctokit } from './utils.js';

export const handleWebhook = async (payload: any) => {
  // console.log('Received webhook:', payload);
  const octokit = await getOctokit(payload.installation.id);

  // add handling here, see utils.ts

};
