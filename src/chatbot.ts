import { Ollama } from "ollama";
import { AzureOpenAI } from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

import { SocialMediaPost } from "./types";

export interface IChatbot {
  isPostRelevant({ post }: { post: SocialMediaPost }): Promise<boolean>;
  generateReply({ post }: { post: SocialMediaPost }): Promise<string>;
}

export class ChatGptChatbot {
  /**
   * Class constructor.
   */
  constructor(
    private _config: {
      azureEndpoint: string;
      azureApiKey: string;
      modelName: string;
    }
  ) {}

  /**
   * Determine if a reddit post is relevant to the business.
   */
  async isPostRelevant({ post }: { post: SocialMediaPost }) {
    const openai = this._getOpenAiClient();

    if (!post.content) return false;

    const response = await openai.chat.completions.create({
      model: this._config.modelName,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Is the following post relevant to the business? Reply with "yes" or "no".
Title: ${post.title}
Content: ${post.content}`,
        },
      ],
      max_completion_tokens: 5000,
      response_format: zodResponseFormat(PostRelevanceSchema, "PostRelevance"),
    });

    const choice = response.choices[0];
    if (choice.finish_reason !== "stop") {
      throw new Error(
        `OpenAI response did not finish: ${choice.finish_reason}`
      );
    }
    const exclusionDecision = PostRelevanceSchema.parse(
      JSON.parse(choice.message.content || "{}")
    );

    return exclusionDecision.isRelevant;
  }

  /**
   * Generate a reply to a social media post.
   */
  async generateReply({ post }: { post: SocialMediaPost }) {
    const openai = this._getOpenAiClient();

    const response = await openai.chat.completions.create({
      model: this._config.modelName,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Reply to the following post. Don't put too much empahsis on the app to not sound like you work for them, but mention the name. Also try to keep it short
Title: ${post.title}
Content: ${post.content}`,
        },
      ],
      max_completion_tokens: 16384,
    });

    const message = response.choices[0].message.content?.trim();
    if (!message) {
      throw new Error("Failed to generate a reply");
    }

    // make sure the message is not suroounded by quotes
    if (message.startsWith('"') && message.endsWith('"')) {
      return message.slice(1, -1);
    }

    return message;
  }

  /**
   * Get Open AI client.
   */
  private _getOpenAiClient() {
    const openai = new AzureOpenAI({
      // apiVersion: "2024-10-21",
      apiVersion: "2024-12-01-preview",
      endpoint: this._config.azureEndpoint,
      apiKey: this._config.azureApiKey,
    });

    return openai;
  }
}

const SYSTEM_PROMPT = `You are a marketing assistant at a company that sells First 2 Apply. 
First2Apply is a job search automation tool that provides real-time job alerts from over 10 popular job boards like LinkedIn, Indeed, Dice, Glassdoor, BuildIn, Remotive, Remote IO, RemoteOK, WeWorkRemotely, FlexJobs, Robert Half, USAJobs.gov. 
It features advanced matching, which analyzes job listings with AI to match users with the most relevant opportunities based on their profiles. 
Additionally, users can customize alerts, apply filters, and manage their applications efficiently to ensure they are among the first to apply to suitable positions.

First 2 Apply strongly believes that applying to jobs as soon as they are posted increases the chances of getting noticed, interviewed, and hired.
Most people don't check when a job was posted and then wonder why they never hear back. A good advice is to add filters to only see jobs posted in the last 24 hours. Most jobs boards have this feature.

What First2Apply is NOT:
  - It is not a job board or a recruitment agency.
  - It is not a resume writing service.
  - It is not a career coaching service.
  - It is not a job placement service.
  - It doesn not help with passing ATS systems.

The ideal customer profile is someone who is actively looking for a job, has a resume, and is familiar with job boards.
You are responsible for reviewing social media posts and provide helpful feedback as well as mentioning how the app can be useful to the user.
You need to pretend to have used the app and offer it as a solution to the user's problem.
Don't consider posts where people already got a job.

Make sure you never:
  - Mention that you work for First2Apply.
  - Make it too obvious that you are shilling the app.
  - Make any promises about the app that are not true.
  - Provide any personal information about yourself or the company.
  - Use any language that could be considered offensive or inappropriate.
  - Provide any medical, legal, or financial advice.
  - Provide any information that could be considered confidential or proprietary.
  - Provide any information that could be considered spam or advertising.
  - Provide any information that could be considered defamatory or libelous.
  - Provide any information that could be considered harmful or dangerous.
  - Provide any information that could be considered illegal or unethical.
  - Keep it short and sweet. Maybe under 1000 characters.
  - Avoid using em dashes, use commas or semicolons instead, try to sound as human as possible.

Here are a few ideas that you should know job hunting:
  - Applying to jobs as soon as they are posted increases your chances of getting noticed/initerviewed/hired.
  - It is still not proven that ATS systems are automatically rejecting resumes by using AI to filter out candidates based on keywords.

Here are some examples of good replies:

Post Title: "What job boards are actually better than the mainstream ones (LinkedIn, Indeed, ZipRecruiter)?"
Post Content: "Hi everyone! I’ve been seeing many people talk about how there are better job boards than LinkedIn, Indeed, and ZipRecruiter.
For me when I was looking for my first role in SWE, I found my jobs through these platforms but now I’m hearing about a bunch more nowadays (Hiring Cafe, FlexJobs, RemoteCo, Wellfound, WonsultingAI, Simplify, etc)
Want to make sure I’m suggesting the right job boards to friends and clients!
Would love to hear from peoples experiences using other job boards to land the jobs. Thank you!"
Reply: "There is no right answer. LinkedIn and Indeed work for a lot of people, but others have better luck using other job boards.

Ideally one should be using as many job boards as possible. You never know where you’ll get lucky, it’a a numbers game.

Unfortunately most people struggle with using more than 3-4 sites at a time because it’s very time consuming to constantly refresh them.

You could have a look at https://first2apply.com/ You can use it to browse 8-10 job boards at the same time. It will check any search you save and only notify you when it finds a new listing. And it also offers some nice filtering capabilities like excluding companies or jobs that have certain keywords"
`;

export class OllamaChatbot {
  private _ollama = new Ollama({
    host: this._config.host,
  });

  /**
   * Class constructor.
   */
  constructor(
    private _config: {
      host: string;
      model: string;
    }
  ) {}

  /**
   * IChatbot implementation.
   */
  async isPostRelevant({ post }: { post: SocialMediaPost }) {
    const response = await this._ollama.chat({
      model: this._config.model,
      options: {
        temperature: 0,
        top_p: 0,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Is the following post relevant to the business? Reply with "yes" or "no".
A post is relevant to the business only if the OP would fit the ideal customer profile.

Title: ${post.title}
Content: ${post.content}`,
        },
      ],
    });
    // console.log(response);

    const message = response.message.content?.trim();
    return message?.toLowerCase().startsWith("yes");
  }

  async generateReply({ post }: { post: SocialMediaPost }) {
    const response = await this._ollama.chat({
      model: this._config.model,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Reply to the following post. Don't put too much empahsis on the app to not sound like you work for them, but mention the name. Also try to keep it short
Title: ${post.title}
Content: ${post.content}`,
        },
      ],
    });

    const message = response.message.content;

    // make sure the message is not suroounded by quotes
    if (message.startsWith('"') && message.endsWith('"')) {
      return message.slice(1, -1);
    }

    return message;
  }
}

const PostRelevanceSchema = z.object({
  isRelevant: z.boolean(),
});
