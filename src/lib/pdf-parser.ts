import * as pdfjsLib from 'pdfjs-dist';

// Check if we're in a browser environment
// Check if we're in a browser environment
if (typeof window !== 'undefined' && 'Worker' in window) {
    // Use local worker file to avoid CDN/CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface PDFExtractionResult {
    text: string;
    numPages: number;
    info?: Record<string, unknown>;
}

/**
 * Extracts text content from a PDF file in the browser.
 * @param file The PDF file object
 * @returns A promise that resolves to the extracted text and metadata
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
    try {
        const arrayBuffer = await file.arrayBuffer();

        // Load the document
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDocument = await loadingTask.promise;

        const numPages = pdfDocument.numPages;
        let fullText = '';

        // Iterate through all pages
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Extract strings and join them
            const pageText = textContent.items
                .map((item) => (item as { str: string }).str || '')
                .join(' ');

            fullText += `[Page ${pageNum}]\n${pageText}\n\n`;
        }

        return {
            text: fullText.trim(),
            numPages,
        };
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw new Error('Failed to parse PDF file. Ensure it is a valid PDF document.');
    }
}
