# RAG Document Chatbot

Upload a document, ask it questions, get answers. That's the whole idea.

You can drop in a PDF, a Word file, a plain text file or a CSV, and then chat with it. The bot answers from what's written in your files and nothing else. If the answer isn't in there, it says so instead of making something up.

I built this as a learning project around RAG, which stands for Retrieval-Augmented Generation. It sounds fancy, but the idea is simple: find the parts of a document that matter for a question, then hand only those parts to a language model. Everything here runs on your own machine. No API keys, no accounts, no bills.

## What you get

- Upload PDF, DOCX, TXT and CSV files, up to 10 MB each
- Upload several documents and chat across all of them. You can add more at any time without restarting anything
- Every answer shows which file it came from
- The bot remembers the last few messages, so you can ask a follow-up like "and who leads the team?" without repeating yourself
- A typing indicator while the answer is being written
- Clear error messages when you send an empty question, upload an unsupported file, or pick a file that's too big or has no text in it
- Light and dark mode
- A Clear button to start over
- A layout that works on phones as well as desktops (Bootstrap 5)

## How it works

When you upload a file, the server reads out the text and cuts it into pieces of about 1000 characters. Each piece gets turned into a list of numbers that captures its meaning. These lists are called embeddings, and they're kept in memory.

Your question goes through the same process. The app then looks for the pieces whose numbers sit closest to the question's numbers, which means the pieces that talk about the same thing. Those pieces, your question and the last few messages go to a small language model running on your computer. The model is told to answer only from what it was given.

Here's what each part is made of:

- Reading files: `pdf-parse` for PDFs, `mammoth` for Word files
- Cutting text: LangChain's `RecursiveCharacterTextSplitter`
- Embeddings: `Xenova/all-MiniLM-L6-v2`, run locally with `@xenova/transformers`
- Storage: LangChain's `MemoryVectorStore`
- The language model: `qwen3:1.7b`, run locally with Ollama

## Before you start

You need two things:

- Node.js 18 or newer
- Ollama, installed and running. Get it from https://ollama.com

## Setup

1. Get the project onto your computer and open a terminal in its folder.

2. Install the packages.

   ```
   npm install
   ```

3. Download the language model. It's about 1.4 GB, but you only do this once.

   ```
   ollama pull qwen3:1.7b
   ```

4. Make your settings file by copying the example.

   ```
   copy .env.example .env
   ```

   On Mac or Linux, use `cp .env.example .env`.

5. Start the server.

   ```
   node server.js
   ```

   If you see "Server running on port 3000", you're good.

6. Open `index.html` in your browser.

One thing to know: your very first upload will feel slow, maybe 10 to 30 seconds. The app is downloading and loading the small embedding model (around 25 MB). After that it's quick.

## Using it

Pick a file and press Upload. Want more documents? Just do it again. Then type your question and hit Enter. The answer shows up with the source file name underneath.

The Dark Mode button changes the theme, and Clear wipes the chat and the bot's memory of it.

Try asking something that isn't in your documents. A good run ends with the bot telling you it can't answer that from the uploaded file.

## Project structure

```
ai-chatbot/
├── server.js                  Express server
├── index.html                 The chat page
├── app.js                     Frontend code
├── routes/
│   ├── uploadRoutes.js        Upload route and file checks (multer)
│   └── chatRoutes.js          Chat route
├── controllers/
│   ├── uploadController.js    Handles an uploaded file
│   └── chatController.js      Handles a question
├── services/
│   ├── documentService.js     Reads text from files and splits it
│   ├── vectorStoreService.js  Embeddings and the vector store
│   └── ragService.js          Finds the right pieces and asks the model
├── middleware/
│   └── errorHandler.js        Error responses
├── .env.example
└── package.json
```

## Settings

The port lives in `.env` and defaults to 3000. If you change it, update `API_BASE_URL` at the top of `app.js` too, or the page won't find the server.

To use a different model, edit `OLLAMA_MODEL` in `services/ragService.js`. The name has to match what `ollama list` shows.

## When something goes wrong

**"Cannot reach Ollama."** Ollama isn't running. Start it from the tray icon, or run `ollama serve`.

**Model not found.** Run `ollama pull qwen3:1.7b`, or check the model name in `ragService.js`.

**"Server error. Is the backend running?"** The server is off. Start it with `node server.js`.

**Port already in use.** An old copy of the server is still open somewhere. Close it, or pick another port in `.env`.

**Everything vanished after a restart.** That's normal. Documents live in memory, so you need to upload them again.
