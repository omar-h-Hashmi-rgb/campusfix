import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function analyzeTicketWithAI(
    description: string,
    imageBase64?: string
): Promise<{
    category: string;
    urgency: number;
    summary: string;
    translated_text?: string;
    native_response?: string;
}> {
    try {
        console.log('Checking API Key:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'EXISTS' : 'MISSING');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const prompt = `You are a polyglot campus maintenance specialist. The input text/voice might be in any Indian language (Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada, Bengali, Malayalam, or English).

INSTRUCTIONS:
1. Detect the language of the input
2. If NOT in English, translate it to English for database storage
3. Classify into: [Electrical, Water, Cleanliness, Infrastructure, Safety, Technology, Other]
4. Score urgency from 1-10 based on SEVERITY and IMPACT (see priority rules below)
5. Generate a 3-word summary in English
6. Provide a brief status confirmation message in the SAME NATIVE LANGUAGE the student used

PRIORITY SCORING RULES (CRITICAL - FOLLOW STRICTLY):

PRIORITY 9-10 (CRITICAL EMERGENCY):
- Fire, smoke, gas leak, explosion risk
- Flooding affecting electrical systems or equipment
- Structural collapse, ceiling/wall falling
- Exposed live wires, electrocution risk
- Severe injury risk, immediate danger to life
- Complete power outage in critical areas
- Sewage overflow in occupied spaces
Keywords: fire, flood, collapse, exposed wire, gas leak, emergency, danger, life-threatening, electrocution

PRIORITY 7-8 (HIGH URGENCY):
- Water pipe burst, major leak
- Flooding in classrooms/labs/computer rooms
- No water supply in entire building/floor
- Broken stairs, railings, safety hazards
- Non-functional emergency exits
- Equipment damage risk (computers, machinery)
- Broken glass, sharp objects in walkways
Keywords: burst, flooding, no water, broken stairs, equipment at risk, major leak, safety hazard

PRIORITY 5-6 (MEDIUM):
- Leaking taps, slow drains
- Broken furniture, doors, windows
- Malfunctioning AC, fans, lights
- Dirty washrooms, overflowing bins
- Minor cracks, paint peeling
Keywords: leaking, broken, not working, dirty, minor

PRIORITY 1-4 (LOW):
- Cosmetic issues, paint touch-ups
- Requests for new equipment
- Minor cleanliness issues
- Suggestions, feedback
Keywords: request, suggestion, minor, cosmetic

IMPORTANT: Analyze the IMPACT and SEVERITY, not just keywords. "Flooding in computer lab" = P9 (equipment damage + safety). "Leaking tap" = P5 (minor inconvenience).

Response must be valid JSON only:
{
  "category": "...",
  "urgency": 8,
  "summary": "...",
  "translated_text": "English translation (only if original was not English, otherwise null)",
  "native_response": "Brief confirmation in student's native language (e.g., 'आपकी शिकायत दर्ज हो गई है' for Hindi)"
}

Complaint: ${description}`;

        let result;

        if (imageBase64) {
            const imagePart = {
                inlineData: {
                    data: imageBase64.split(',')[1],
                    mimeType: imageBase64.split(';')[0].split(':')[1],
                },
            };

            result = await model.generateContent([prompt, imagePart]);
        } else {
            result = await model.generateContent(prompt);
        }

        const response = result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in AI response');
        }

        const aiResponse = JSON.parse(jsonMatch[0]);

        return {
            category: aiResponse.category || 'Other',
            urgency: Math.min(Math.max(aiResponse.urgency || 5, 1), 10),
            summary: aiResponse.summary || 'Issue reported',
            translated_text: aiResponse.translated_text || undefined,
            native_response: aiResponse.native_response || undefined,
        };
    } catch (error) {
        console.error('AI analysis error:', error);
        return {
            category: 'Other',
            urgency: 5,
            summary: 'Needs review',
        };
    }
}

export async function generateFixGuide(
    title: string,
    description: string,
    category: string,
    imageBase64?: string
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash'
        });

        const prompt = `You are a professional maintenance consultant. Based on this campus maintenance issue, provide a clear 3-step technical guide for a maintenance worker to fix it.

Issue Title: ${title}
Category: ${category}
Description: ${description}

Provide:
1. Step-by-step instructions (3 main steps)
2. Estimated time to complete
3. Tools/materials needed

Keep it concise and practical. Format as plain text, not JSON.`;

        let result;

        if (imageBase64) {
            const imagePart = {
                inlineData: {
                    data: imageBase64.split(',')[1],
                    mimeType: imageBase64.split(';')[0].split(':')[1],
                },
            };

            result = await model.generateContent([prompt, imagePart]);
        } else {
            result = await model.generateContent(prompt);
        }

        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('Fix guide generation error:', error);
        return 'Unable to generate fix guide at this time. Please consult with senior maintenance staff.';
    }
}
