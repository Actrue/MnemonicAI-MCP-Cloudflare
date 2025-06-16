import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {Hono} from "hono"
import { dbFunction } from "./db.js";
// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "MemoryCard mcp",
		version: "1.0.0",
	});
	

	async init() {
		
		

		this.server.tool(
			"createMemoryCard",
			"这个工具用于创建记忆卡片，用户将给你提供他想要记住的关键概念，你需要根据关键概念，设计一个问题，这个问题的作用是可以启发用户回想这个关键概念，然后将你设计的问题以及用户想要记住的关键概念一起保存到记忆卡片中，content部分是用户想要记住的核心概念，question部分是你设计的问题。",
			{ content: z.string(), question: z.string() },
			async ({ content, question }) => {
				const info = await dbFunction.createMemoryCard({ content, question });
				return { content: [{ type: "text", text: String(info.message) }] };
			}
		);

		this.server.tool(
			"getReviewCards",
			"这个工具用于获取需要复习的记忆卡片，按照记忆曲线算法自动筛选出当前需要复习的卡片。你需要给用户展示记忆卡片中的问题，引导用户回答问题，对比用户的回答是否与答案一致（含义一致即可），如果一致就调用更新卡片信息的功能，把卡片标注为已复习",
			{},
			async () => {
				const result = await dbFunction.getMemoryCards();
				return { content: [{ type: "text", text: JSON.stringify(result) }] };
			}
		);

		this.server.tool(
			"getAllCards",
			"这个工具用于获取所有的记忆卡片，无论是否需要复习。",
			{},
			async () => {
				const result = await dbFunction.getAllMemoryCards();
				return { content: [{ type: "text", text: JSON.stringify(result) }] };
			}
		);

		this.server.tool(
			"标注已复习的卡片",
			"这个工具用于更新已复习的记忆卡片，可以标注已复习的记忆卡片，接受已复习的卡片的id数组",
			{ ids: z.array(z.number()) },
			async ({ ids }) => {
				const result = await dbFunction.batchUpdateMemoryCards(ids);
				return { content: [{ type: "text", text: JSON.stringify(result.message) }] };
			}
		);

		this.server.tool(
			"deleteMemoryCard",
			"这个工具用于删除指定的记忆卡片，接受要删除的卡片id",
			{ id: z.string() },
			async ({ id }) => {
				const result = await dbFunction.deleteMemoryCard(id);
				return { content: [{ type: "text", text: JSON.stringify(result.message) }] };
			}
		);

		this.server.tool(
			"getRandomCard",
			"这个工具用于随机获取一张记忆卡片",
			{},
			async () => {
				const result = await dbFunction.getRandomMemoryCard();
				return { content: [{ type: "text", text: JSON.stringify(result.data) }] };
			}
		);
	}
}

type HeaderType={
	key:string
}

const app = new Hono<{Variables:HeaderType}>()

app.use("*",async(c,next)=>{
	const key=c.req.header("key")
	if(!key){
		return c.json({message:"key is required"},400)
	}
	c.set("key",key)

	await next()

})

app.mount('/sse', MyMCP.serveSSE('/sse').fetch, { replaceRequest: false })
app.mount('/mcp', MyMCP.serve('/mcp').fetch, { replaceRequest: false })

export default app
