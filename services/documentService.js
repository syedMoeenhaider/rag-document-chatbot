const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

class DocumentService {
    async extractText(file) {
        const ext = path.extname(file.originalname).toLowerCase();

        if (ext === '.pdf') {
            try {
                const parseFunc = typeof pdf === 'function' ? pdf : pdf.default;
                const data = await parseFunc(file.buffer);
                return data.text;
            } catch (error) {
                throw new Error("PDF processing failed. Please try another file.");
            }
        }

        if (ext === '.docx') {
            try {
                const result = await mammoth.extractRawText({ buffer: file.buffer });
                return result.value;
            } catch (error) {
                throw new Error("DOCX processing failed. The file may be damaged.");
            }
        }

        if (ext === '.txt' || ext === '.csv') {
            return file.buffer.toString('utf8');
        }

        throw new Error("Unsupported file type. Please upload a PDF, DOCX, TXT or CSV file.");
    }

    async splitIntoChunks(text, fileName) {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        return await splitter.createDocuments([text], [{ source: fileName }]);
    }
}

module.exports = new DocumentService();
