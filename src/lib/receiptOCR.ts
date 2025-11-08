import { invokeLLM } from "./_core/llm";

export interface ReceiptData {
  amount: number | null;
  date: string | null;
  merchant: string | null;
  category: string | null;
  confidence: {
    amount: number;
    date: number;
    merchant: number;
    category: number;
  };
  rawText?: string;
}

/**
 * Extract structured data from receipt image using LLM vision
 */
export async function extractReceiptData(imageUrl: string): Promise<ReceiptData> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a receipt data extraction assistant. Analyze receipt images and extract key information.
Return ONLY a JSON object with this exact structure:
{
  "amount": number or null,
  "date": "YYYY-MM-DD" or null,
  "merchant": "string" or null,
  "category": "string" or null,
  "confidence": {
    "amount": 0-100,
    "date": 0-100,
    "merchant": 0-100,
    "category": 0-100
  }
}

Categories should be one of: groceries, dining, transportation, utilities, healthcare, entertainment, shopping, other.
If you cannot extract a field with confidence, set it to null and confidence to 0.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the amount, date, merchant name, and suggest a category from this receipt image."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "receipt_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              amount: {
                type: ["number", "null"],
                description: "Total amount from the receipt"
              },
              date: {
                type: ["string", "null"],
                description: "Transaction date in YYYY-MM-DD format"
              },
              merchant: {
                type: ["string", "null"],
                description: "Merchant or store name"
              },
              category: {
                type: ["string", "null"],
                description: "Suggested transaction category"
              },
              confidence: {
                type: "object",
                properties: {
                  amount: { type: "number", description: "Confidence score 0-100" },
                  date: { type: "number", description: "Confidence score 0-100" },
                  merchant: { type: "number", description: "Confidence score 0-100" },
                  category: { type: "number", description: "Confidence score 0-100" }
                },
                required: ["amount", "date", "merchant", "category"],
                additionalProperties: false
              }
            },
            required: ["amount", "date", "merchant", "category", "confidence"],
            additionalProperties: false
          }
        }
      }
    });

    const message = response.choices[0]?.message;
    if (!message || !message.content) {
      throw new Error("No response from LLM");
    }

    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    const data = JSON.parse(content) as ReceiptData;
    
    // Validate and sanitize the data
    return {
      amount: data.amount,
      date: data.date,
      merchant: data.merchant,
      category: data.category,
      confidence: {
        amount: Math.min(100, Math.max(0, data.confidence.amount)),
        date: Math.min(100, Math.max(0, data.confidence.date)),
        merchant: Math.min(100, Math.max(0, data.confidence.merchant)),
        category: Math.min(100, Math.max(0, data.confidence.category))
      }
    };
  } catch (error) {
    console.error("[ReceiptOCR] Failed to extract receipt data:", error);
    throw new Error("Failed to process receipt image");
  }
}

/**
 * Validate if an image URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentType = response.headers.get("content-type");
    return response.ok && (contentType?.startsWith("image/") || false);
  } catch {
    return false;
  }
}
