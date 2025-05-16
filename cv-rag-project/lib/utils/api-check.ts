import OpenAI from 'openai';

export async function checkOpenAIConnection(): Promise<boolean> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Make a simple API call to test the connection
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('OpenAI API connection check failed:', error);
    return false;
  }
}