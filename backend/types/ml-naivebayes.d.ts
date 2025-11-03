declare module "ml-naivebayes" {
  interface PredictionResult {
    category: string;
    probability: number;
  }

  class NaiveBayes {
    train(trainingSet: Array<{ input: number[]; output: string }>): void;
    predict(features: number[]): PredictionResult;
  }

  export = NaiveBayes;
}
