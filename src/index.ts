/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { ChatOpenAI } from '@langchain/openai';
import { Client } from 'langsmith';

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const client = new Client({
      apiKey: env.LANGCHAIN_API_KEY,
      apiUrl: env.LANGCHAIN_ENDPOINT,
    });

    const tracer = new LangChainTracer({
      projectName: env.LANGCHAIN_PROJECT,
      client: client,
    });

    const model = new ChatOpenAI({
      model: 'gpt-4o',
      openAIApiKey: env.OPENAI_API_KEY,
      modelKwargs: { response_format: { type: 'json_object' } },
    });

    const TEMPLATE = `Answer the user's question to the best of your ability.
    You must always output a JSON object with an "answer" key and a "followup_question" key.
    
    {question}`;

    const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);
    const chain = prompt.pipe(model).pipe(new JsonOutputParser());

    await chain.invoke(
      { question: 'What is the powerhouse of the cell?' },
      { callbacks: [tracer] }
    );

    return new Response('Hello World!');
  },
} satisfies ExportedHandler<Env>;
