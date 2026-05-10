import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeDataset(dataSample: any[], columns: string[]) {
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are a masterful data scientist. Analyze the following data sample and provide:
    1. A concise, high-level summary of the dataset.
    2. Key insights and patterns found in the data.
    3. Recommendations for further exploration.
    4. Suggested visualizations (type and why).

    Data Sample (First 20 rows):
    ${JSON.stringify(dataSample.slice(0, 20))}
    
    Columns: ${columns.join(', ')}

    Output your response in a structured Markdown format.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function generateWidgetSuggestions(columns: string[]) {
   const model = "gemini-3-flash-preview";
   const prompt = `
    Based on these data columns: ${columns.join(', ')}, suggest 3-5 useful visualization widgets.
    Return a JSON array of objects with:
    - title: title of the chart
    - type: one of "line", "bar", "pie", "scatter", "heatmap", "network", "sankey", "map"
    - xField: column name for x-axis (or source for sankey/network, or latitude for map)
    - yField: column name for y-axis (or target for sankey/network, or longitude for map)
   `;

   try {
     const response = await ai.models.generateContent({
       model,
       contents: prompt,
       config: {
         responseMimeType: "application/json",
         responseSchema: {
           type: Type.ARRAY,
           items: {
             type: Type.OBJECT,
             properties: {
               title: { type: Type.STRING },
               type: { type: Type.STRING, enum: ["line", "bar", "pie", "scatter", "heatmap", "network", "sankey", "map"] },
               xField: { type: Type.STRING },
               yField: { type: Type.STRING },
               labelField: { type: Type.STRING },
               valueField: { type: Type.STRING }
             },
             required: ["title", "type", "xField", "yField"]
           }
         }
       }
     });
     return JSON.parse(response.text);
   } catch (error) {
     console.error("Widget Suggestion Error:", error);
     return [];
   }
}
