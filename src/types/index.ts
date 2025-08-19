export interface Layer {
  name: string;
  type: string;
  outputShape: string;
  params: number;
  config: Record<string, any>;
}

export interface ModelData {
  name: string;
  layers: Layer[];
}
