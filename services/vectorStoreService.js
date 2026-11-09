const { Embeddings } = require("@langchain/core/embeddings");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { pipeline } = require("@xenova/transformers");

class MyLocalEmbeddings extends Embeddings {
    constructor() {
        super({});
        this.extractor = null;
    }

    async init() {
        if (!this.extractor) {
            console.log("Loading local embedding model...");
            this.extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
            console.log("Local embedding model ready.");
        }
    }

    async embedDocuments(texts) {
        await this.init();
        const vectors = [];

        for (const text of texts) {
            const output = await this.extractor(text, { pooling: "mean", normalize: true });
            vectors.push(output.tolist()[0]);
        }

        return vectors;
    }

    async embedQuery(text) {
        await this.init();
        const output = await this.extractor(text, { pooling: "mean", normalize: true });
        return output.tolist()[0];
    }
}

class VectorStoreService {
    constructor() {
        this.vectorStore = null;
        this.embeddings = new MyLocalEmbeddings();

        this.firstChunks = new Map();
    }

    async addDocuments(docs, fileName) {
        if (!this.vectorStore) {
            this.vectorStore = new MemoryVectorStore(this.embeddings);
        } else {
            this.vectorStore.memoryVectors = this.vectorStore.memoryVectors.filter(
                (item) => item.metadata.source !== fileName
            );
        }

        await this.vectorStore.addDocuments(docs);
        this.firstChunks.set(fileName, docs[0]);
    }

    getStore() {
        return this.vectorStore;
    }

    getFirstChunks() {
        return Array.from(this.firstChunks.values());
    }

    getFileNames() {
        return Array.from(this.firstChunks.keys());
    }
}

module.exports = new VectorStoreService();
