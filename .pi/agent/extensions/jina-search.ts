
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
    const request = async (url: string) => {
        const res = await fetch(url, {
            headers: {
                ...(process.env.JINA_API_KEY && {
                    Authorization: `Bearer ${process.env.JINA_API_KEY}`,
                }),
            },
        });
        if (!res.ok) throw new Error(`Jina API: ${res.status}`);
        return { content: [{ type: "text" as const, text: await res.text() }] };
    };

    pi.registerTool({
        name: "web_search",
        label: "Web Search",
        description: "Search the web using Jina AI.",
        parameters: Type.Object({ query: Type.String() }),
        execute: async (_id, { query }) =>
            request(`https://s.jina.ai/${encodeURIComponent(query)}`),
    });

    pi.registerTool({
        name: "web_fetch",
        label: "Web Fetch",
        description: "Read a public webpage using Jina AI.",
        parameters: Type.Object({ url: Type.String() }),
        execute: async (_id, { url }) =>
            request(`https://r.jina.ai/${url}`),
    });
}
