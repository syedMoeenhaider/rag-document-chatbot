const vectorStoreService = require("./vectorStoreService");

const OLLAMA_URL = "http://localhost:11434/api/chat";
const OLLAMA_MODEL = "qwen3:1.7b";

class RagService {
    async answerQuestion(question, history = []) {
        const vectorStore = vectorStoreService.getStore();

        if (!vectorStore) {
            throw new Error("Please upload a document first.");
        }

        let searchQuery = question;
        const lastUserMessage = [...history].reverse().find((m) => m.role === 'user');
        if (lastUserMessage && question.split(/\s+/).length < 8) {
            searchQuery = lastUserMessage.content + " " + question;
        }

        const results = await vectorStore.similaritySearch(searchQuery, 5);

        const sourceFiles = [...new Set(results.map((doc) => doc.metadata.source).filter(Boolean))];

        const contextDocs = [...results];
        for (const first of vectorStoreService.getFirstChunks()) {
            const alreadyThere = contextDocs.some((doc) => doc.pageContent === first.pageContent);
            if (!alreadyThere) {
                contextDocs.unshift(first);
            }
        }

        const context = contextDocs
            .map((doc) => `[File: ${doc.metadata.source}]\n${doc.pageContent}`)
            .join("\n\n");

        let response;
        try {
            response = await fetch(OLLAMA_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: OLLAMA_MODEL,
                    stream: false,
                    think: false,
                    options: { temperature: 0.3 },
                    messages: [
                        {
                            role: "system",
                            content:
                                "You are a helpful AI assistant. Answer the user's question using ONLY the context provided below. " +
                                "The context may come from more than one file. " +
                                "If the user asks a general question such as 'what is this' or 'summarize', give a short summary of the context. " +
                                "Never use outside knowledge, and do not invent suggestions, opinions or advice that the context does not state. " +
                                "If the answer is truly not in the context, reply with: 'I cannot answer this based on the uploaded document.' " +
                                "The document may mix English and Roman Urdu, so reply in the same language as the question."
                        },
                        ...history,
                        {
                            role: "user",
                            content: `Context:\n${context}\n\nQuestion: ${question}`
                        }
                    ]
                })
            });
        } catch (err) {
            throw new Error("Cannot reach Ollama. Make sure Ollama is running.");
        }

        if (!response.ok) {
            const details = await response.text();
            throw new Error(`Ollama error: ${details}`);
        }

        const data = await response.json();
        const rawAnswer = data.message?.content || "";
        const answer = rawAnswer.replace(/<think>[\s\S]*?<\/think>/g, "").trim() || "No response generated.";

        return { answer, sources: sourceFiles };
    }
}

module.exports = new RagService();
