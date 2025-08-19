"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";
import type { Dataset } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Loader, XCircle, FileText } from "lucide-react";

const DatasetTable = ({ dataset }: { dataset: Dataset }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <FileText className="mr-2 h-5 w-5" />
        {dataset.name}
      </CardTitle>
      <CardDescription>
        Showing the first 5 rows of the uploaded dataset.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {dataset.headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataset.rows.slice(0, 5).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);


export default function DatasetUploader() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.name.endsWith('.txt')) {
          toast({
              variant: "destructive",
              title: "Invalid File Type",
              description: "Please upload a valid .txt dataset file.",
          });
          return;
      }
      setIsLoading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0) {
          const headers = lines[0].split(';').map(h => h.trim());
          const rows = lines.slice(1).map(line => line.split(';').map(cell => cell.trim()));
          setDataset({ name: file.name, headers, rows });
          toast({
            title: "Dataset Loaded",
            description: `${file.name} has been processed.`,
          });
        } else {
            toast({
                variant: "destructive",
                title: "Empty File",
                description: "The selected file is empty.",
            });
        }
        setIsLoading(false);
      };
      reader.onerror = () => {
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
        });
        setIsLoading(false);
      }
      reader.readAsText(file);
    }
    // Reset file input to allow uploading the same file again
    event.target.value = '';
  };

  const handleReset = () => {
    setDataset(null);
  };

  if (!dataset) {
    return (
      <Card className="max-w-2xl mx-auto border-2 border-dashed border-border hover:border-primary transition-colors duration-300 bg-secondary/20">
        <CardContent className="p-10 flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <>
              <Loader className="h-16 w-16 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Processing Dataset...</h3>
              <p className="text-muted-foreground">Please wait while we parse your dataset file.</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-16 w-16 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload your .txt Dataset</h3>
              <p className="text-muted-foreground mb-6">Drag and drop your file here or click to browse.</p>
              <Button asChild size="lg">
                <label>
                  Select File
                  <input type="file" className="sr-only" accept=".txt" onChange={handleFileSelect} />
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
          Upload Another Dataset
        </Button>
      </div>

      <DatasetTable dataset={dataset} />
    </div>
  );
}
