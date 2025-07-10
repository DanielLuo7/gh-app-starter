import { OpenAI } from "openai"

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY});
const SYSTEM_CONTENT = "You are a code reviewer who checks file diffs for bugs and summarizes file changes";

// returns an array of {line: bug description} objects
export async function checkForBugs(diff: string): Promise<{ line: number; body: string }[]> {

    const context = `
                    You are an expert code reviewer. A developer has submitted a GitHub pull request
                    with the following diffs below.

                    ${diff}

                    Identify **potential bugs or bad practices**. Return a JSON array where each item includes:
                    - "line": the **new line number** the bug appears on
                    - "body": a **concise code review comment**

                    Only include lines from the **latest version** of the file. 
                    If there are no bugs, return an empty array
                    `
    const response = await openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0.2,
        messages: [
            { role: "system", content: SYSTEM_CONTENT },
            { role: "user", content: context}
        ]
    });

    try {
        const output = response.choices[0].message.content?.trim() || "[]";
        return JSON.parse(output);
    } catch (err){
        console.error('Failed to parse bug comment response:', err);
        return [];
    }

}

export async function generateSummary(filename: string, diff: string): Promise<string> {
    const context = `
                    You are a code reviewer helping document changes GitHub pull request.
                    You are given a git diff for a file called \`${filename}\`:

                    ${diff}

                    Write a concise summary in Markdown of what changed in this file. Keep it clear and useful.
                    `

    const response = await openai.chat.completions.create({
        model: 'gpt-4',
        temperature: 0.5,
        messages: [
            { role: "system", content: SYSTEM_CONTENT },
            { role: "user", content: context}
        ]
    });

    return response.choices[0].message.content?.trim() || "";
}
