"use client";

import type { ChangeEvent } from "react";
import { useState, useMemo } from "react";
import type { ModelData, Layer } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Loader, FileCode, Layers, Cpu, Hash, Copy, XCircle, Calendar as CalendarIcon, Zap, BrainCircuit, Thermometer } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { predictEnergyConsumption, type PredictEnergyOutput } from "@/ai/flows/predict-energy";


// Mock data to simulate .h5 model inspection
const mockModelData: ModelData = {
  name: "sequential_model.h5",
  layers: [
    { name: "conv2d_input", type: "InputLayer", outputShape: "[(None, 28, 28, 1)]", params: 0, config: { batch_input_shape: [null, 28, 28, 1], dtype: "float32", sparse: false, ragged: false, name: "conv2d_input" } },
    { name: "conv2d", type: "Conv2D", outputShape: "(None, 26, 26, 32)", params: 320, config: { name: "conv2d", trainable: true, dtype: "float32", filters: 32, kernel_size: [3, 3], strides: [1, 1], padding: "valid", data_format: "channels_last", dilation_rate: [1, 1], groups: 1, activation: "relu" } },
    { name: "max_pooling2d", type: "MaxPooling2D", outputShape: "(None, 13, 13, 32)", params: 0, config: { name: "max_pooling2d", trainable: true, dtype: "float32", pool_size: [2, 2], padding: "valid", strides: [2, 2], data_format: "channels_last" } },
    { name: "flatten", type: "Flatten", outputShape: "(None, 5408)", params: 0, config: { name: "flatten", trainable: true, dtype: "float32", data_format: "channels_last" } },
    { name: "dense", type: "Dense", outputShape: "(None, 128)", params: 692352, config: { name: "dense", trainable: true, dtype: "float32", units: 128, activation: "relu", use_bias: true } },
    { name: "dropout", type: "Dropout", outputShape: "(None, 128)", params: 0, config: { name: "dropout", trainable: true, dtype: "float32", rate: 0.5, noise_shape: null, seed: null } },
    { name: "dense_1", type: "Dense", outputShape: "(None, 10)", params: 1290, config: { name: "dense_1", trainable: true, dtype: "float32", units: 10, activation: "softmax", use_bias: true } },
  ],
};

// Sub-components defined within the main component file for better encapsulation
const ArchitectureSummary = ({ data }: { data: ModelData }) => {
  const totalLayers = data.layers.length;
  const totalParams = useMemo(() => data.layers.reduce((sum, layer) => sum + layer.params, 0), [data.layers]);

  const summaryCards = [
    { title: "Model Name", value: data.name, icon: FileCode },
    { title: "Total Layers", value: totalLayers.toLocaleString(), icon: Layers },
    { title: "Total Parameters", value: totalParams.toLocaleString(), icon: Cpu },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {summaryCards.map((card, index) => (
        <Card key={index} className="bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const LayerDetailsTable = ({ layers, onSelectLayer }: { layers: Layer[], onSelectLayer: (layer: Layer) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>Layer Details</CardTitle>
      <CardDescription>Inspect individual layers of the model.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layer Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Output Shape</TableHead>
              <TableHead className="text-right">Parameters</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {layers.map((layer) => (
              <TableRow key={layer.name}>
                <TableCell className="font-medium">{layer.name}</TableCell>
                <TableCell className="text-muted-foreground">{layer.type}</TableCell>
                <TableCell className="font-mono text-sm">{layer.outputShape}</TableCell>
                <TableCell className="text-right font-mono text-sm">{layer.params.toLocaleString()}</TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => onSelectLayer(layer)}>
                    View Config
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

const PredictionSection = ({ modelName }: { modelName: string }) => {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [temperature, setTemperature] = useState([10, 25]);
    const [prediction, setPrediction] = useState<PredictEnergyOutput | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const { toast } = useToast();

    const handlePrediction = async () => {
        if (!date) {
            toast({
                variant: "destructive",
                title: "No Date Selected",
                description: "Please select a date to run the prediction.",
            });
            return;
        }

        setIsPredicting(true);
        setPrediction(null);
        try {
            const result = await predictEnergyConsumption({
                date: date.toISOString(),
                modelName: modelName,
                temperatureRange: temperature,
            });
            setPrediction(result);
            toast({
                title: "Prediction Complete",
                description: `Energy consumption predicted for ${format(date, "PPP")}.`,
            });
        } catch (error) {
            console.error("Prediction failed:", error);
            toast({
                variant: "destructive",
                title: "Prediction Failed",
                description: "An error occurred while generating the prediction.",
            });
        } finally {
            setIsPredicting(false);
        }
    };
    
    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Energy Consumption Prediction</CardTitle>
                <CardDescription>
                    Select a date and temperature range to forecast energy consumption.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-4">
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <div className="flex items-center justify-center text-sm font-medium border rounded-md">
                                <Thermometer className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>{temperature[0]}°C &ndash; {temperature[1]}°C</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="temperature">Temperature Range (°C)</Label>
                            <Slider
                                id="temperature"
                                min={-20}
                                max={40}
                                step={1}
                                value={temperature}
                                onValueChange={setTemperature}
                                className="w-full"
                            />
                        </div>
                        
                        <Button onClick={handlePrediction} disabled={isPredicting || !date} size="lg">
                            {isPredicting ? (
                                <Loader className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Zap className="mr-2 h-5 w-5" />
                            )}
                            Predict Consumption
                        </Button>
                    </div>

                    <div className="min-h-[160px] flex items-center justify-center">
                        {isPredicting && (
                             <div className="text-center text-muted-foreground">
                                <BrainCircuit className="h-10 w-10 mx-auto text-primary animate-pulse" />
                                <p className="mt-2 font-medium">AI is analyzing patterns...</p>
                             </div>
                        )}
                        {prediction && !isPredicting && (
                            <Card className="w-full bg-primary/10 border-primary/30">
                                <CardHeader className="pb-2">
                                    <CardDescription className="text-primary-foreground/80">Predicted Consumption for {date ? format(date, "PPP") : ''}</CardDescription>
                                    <CardTitle className="text-4xl text-primary">{prediction.predictedConsumption.toFixed(2)} kWh</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{prediction.analysis}</p>
                                 </CardContent>
                            </Card>
                        )}
                         {!prediction && !isPredicting && (
                            <div className="text-center text-muted-foreground">
                                <p>Prediction results will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


export default function H5Inspector() {
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.name.endsWith('.h5')) {
          toast({
              variant: "destructive",
              title: "Invalid File Type",
              description: "Please upload a valid .h5 model file.",
          });
          return;
      }
      setIsLoading(true);

      // Simulate file processing and data extraction
      setTimeout(() => {
        setModelData({ ...mockModelData, name: file.name });
        setIsLoading(false);
        toast({
          title: "Model Loaded Successfully",
          description: `${file.name} has been processed.`,
        });
      }, 1500);
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };

  const handleReset = () => {
    setModelData(null);
  };

  const handleCopyConfig = () => {
    if (selectedLayer) {
      navigator.clipboard.writeText(JSON.stringify(selectedLayer.config, null, 2));
      toast({
        title: "Configuration Copied",
        description: `Configuration for layer '${selectedLayer.name}' copied to clipboard.`,
      });
    }
  };

  if (!modelData) {
    return (
      <Card className="max-w-2xl mx-auto border-2 border-dashed border-border hover:border-primary transition-colors duration-300 bg-secondary/20">
        <CardContent className="p-10 flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <>
              <Loader className="h-16 w-16 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Processing Model...</h3>
              <p className="text-muted-foreground">Please wait while we inspect your model file.</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-16 w-16 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload your .h5 Model</h3>
              <p className="text-muted-foreground mb-6">Drag and drop your file here or click to browse.</p>
              <Button asChild size="lg">
                <label>
                  Select File
                  <input type="file" className="sr-only" accept=".h5" onChange={handleFileSelect} />
                </label>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-in fade-in-50 duration-500">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={handleReset}>
          <XCircle className="mr-2 h-4 w-4" />
          Inspect Another Model
        </Button>
      </div>

      <ArchitectureSummary data={modelData} />
      <LayerDetailsTable layers={modelData.layers} onSelectLayer={setSelectedLayer} />
      <PredictionSection modelName={modelData.name} />

      <Dialog open={!!selectedLayer} onOpenChange={(open) => !open && setSelectedLayer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Hash className="h-5 w-5 mr-2 text-primary" />
              Layer Configuration: <span className="font-code ml-2">{selectedLayer?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Detailed configuration for the selected layer. You can copy it to your clipboard.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 max-h-[50vh] overflow-y-auto rounded-md bg-black/50 p-4">
            <pre className="text-sm font-code text-white">
              <code>{selectedLayer && JSON.stringify(selectedLayer.config, null, 2)}</code>
            </pre>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="secondary">Close</Button>
            </DialogClose>
            <Button onClick={handleCopyConfig}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
