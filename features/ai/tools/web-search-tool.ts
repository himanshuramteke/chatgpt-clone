import { tavily } from "@tavily/core";
import { tool } from "ai";
import { z } from "zod";

const client = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});

export const websearchTool = tool({
  description: `
Search the public web for up-to-date information.

Use this tool whenever:
- the user asks for recent news
- the user asks for current events
- the user asks for live information
- the user asks for the latest software versions
- the user asks for current prices
- the answer may have changed after your knowledge cutoff
- you are uncertain about the answer

Do NOT use this tool for:
- programming concepts
- mathematics
- history
- science
- general knowledge
- anything you already know confidently
`,

  inputSchema: z.object({
    query: z.string().min(1).describe("A concise web search query."),
  }),

  execute: async ({ query }) => {
    console.log("🌐 Tavily Search");
    console.log("Query:", query);

    try {
      const response = await client.search(query, {
        topic: "general",
        searchDepth: "advanced",
        maxResults: 8,
        includeAnswer: true,
        includeRawContent: false,
      });

      const sources = response.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score,
      }));

      console.log(`✅ Found ${sources.length} sources`);

      return {
        query,
        answer: response.answer,
        sources,
      };
    } catch (error) {
      console.error("❌ Tavily Search Failed:", error);

      return {
        query,
        answer:
          "I couldn't retrieve information from the web because the search service failed.",
        sources: [],
      };
    }
  },
});
