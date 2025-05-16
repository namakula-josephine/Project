import OpenAI from 'openai';
import * as tf from '@tensorflow/tfjs-node';
import path from 'path';
import { promises as fs } from 'fs';

export interface VisionAnalysisResult {
  predicted_class: string;
  confidence: string;
  explanation: string;
  treatment_plans: string;
}

export class VisionService {
  private openai: OpenAI | null = null;
  private model: tf.LayersModel | null = null;
  private readonly modelPath = path.join(process.cwd(), 'data', 'potato_classification_model.h5');
  private readonly classNames = ['Early Blight', 'Healthy', 'Late Blight'];

  async initialize(): Promise<void> {
    if (!this.model) {
      try {
        console.log('Loading H5 model from:', this.modelPath);
        this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
        console.log('Model loaded successfully');
      } catch (error) {
        console.error('Error loading model:', error);
        throw new Error('Failed to initialize disease detection model');
      }
    }

    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  static async analyzeImage(imageFile: File, sessionId: string): Promise<VisionAnalysisResult> {
    try {
      const visionService = new VisionService(); // Create an instance of VisionService
      await visionService.initialize(); // Call the instance method

      // Save image to a temporary file
      const tempDir = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempDir, { recursive: true });
      const tempPath = path.join(tempDir, `${sessionId}-${Date.now()}.jpg`);
      const imageBuffer = await imageFile.arrayBuffer();
      await fs.writeFile(tempPath, Buffer.from(imageBuffer));

      try {
        // Preprocess and predict
        const image = await visionService.preprocessImage(tempPath);
        const prediction = await visionService.model!.predict(image) as tf.Tensor;
        const probabilities = await prediction.data();
        const maxProbIndex = Array.from(probabilities).indexOf(Math.max(...Array.from(probabilities)));
        const confidence = (probabilities[maxProbIndex] * 100).toFixed(2);
        const predictedClass = visionService.classNames[maxProbIndex];

        // Get explanation from GPT-4
        const explanation = await visionService.getExplanation(predictedClass, confidence);

        // Get treatment recommendations using RAG
        const treatmentPlans = await visionService.getTreatmentPlans(predictedClass);

        // Cleanup tensors and temp file
        tf.dispose([image, prediction]);
        await fs.unlink(tempPath);

        return {
          predicted_class: predictedClass,
          confidence: `${confidence}%`,
          explanation,
          treatment_plans: treatmentPlans,
        };
      } finally {
        // Ensure temp file is cleaned up
        if (await fs.stat(tempPath).catch(() => null)) {
          await fs.unlink(tempPath);
        }
      }
    } catch (error) {
      console.error('Error in image analysis:', error);
      return {
        predicted_class: "Analysis Failed",
        confidence: "N/A",
        explanation: "Failed to process the image. Please ensure the image is clear and in the correct format.",
        treatment_plans: "Unable to provide treatment recommendations due to analysis failure.",
      };
    }
  }

  private async preprocessImage(imagePath: string): Promise<tf.Tensor> {
    const image = await tf.node.decodeImage(await fs.readFile(imagePath), 3);
    const resized = tf.image.resizeBilinear(image as tf.Tensor3D, [224, 224]);
    const normalized = resized.div(255.0);
    const batched = normalized.expandDims(0);
    tf.dispose([image, resized, normalized]);
    return batched;
  }

  private async getExplanation(predictedClass: string, confidence: string): Promise<string> {
    try {
      const response = await this.openai!.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides information about potato plant diseases and treatments."
          },
          {
            role: "user",
            content: `The model predicts the plant has ${predictedClass} with ${confidence}% confidence. Can you explain what this means?`
          }
        ]
      });

      return response.choices[0].message.content || "No explanation available";
    } catch (error) {
      console.error('Error getting explanation:', error);
      return "Failed to generate explanation";
    }
  }

  private async getTreatmentPlans(disease: string): Promise<string> {
    try {
      // This should integrate with your RAG system
      const ragQuery = `What are the treatment options for ${disease} in potato plants?`;
      const ragResponse = await this.queryRAG(ragQuery);
      return ragResponse;
    } catch (error) {
      console.error('Error getting treatment plans:', error);
      return "Failed to generate treatment recommendations";
    }
  }

  private async queryRAG(query: string): Promise<string> {
    // Implement your RAG query logic here
    // This should connect to your existing RAG system
    return "Treatment recommendations will be provided by the RAG system";
  }

  async predict(imageBuffer: Buffer): Promise<{ predictedClass: string; confidence: number }> {
    await this.initialize();

    const image = tf.node.decodeImage(imageBuffer, 3);
    const resized = tf.image.resizeBilinear(image, [224, 224]);
    const normalized = resized.div(255.0).expandDims(0);

    const predictions = this.model!.predict(normalized) as tf.Tensor;
    const probabilities = await predictions.data();
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));

    tf.dispose([image, resized, normalized, predictions]);

    return {
      predictedClass: this.classNames[maxIndex],
      confidence: probabilities[maxIndex],
    };
  }
}