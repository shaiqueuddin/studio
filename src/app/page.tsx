import DatasetUploader from '@/components/dataset-uploader';
import H5Inspector from '@/components/h5-inspector';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold font-headline text-primary">H5 Inspector</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            An elegant developer utility for inspecting `.h5` machine learning models. Upload a file to view its architecture, layers, shapes, and parameter counts.
          </p>
        </header>
        <main>
          <H5Inspector />
          <Separator className="my-12" />
          <div className="mt-8 text-center">
             <h2 className="text-3xl lg:text-4xl font-bold font-headline text-primary">Dataset Viewer</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Upload a semicolon-separated `.txt` dataset to view its contents in a table.
            </p>
          </div>
          <div className="mt-8">
            <DatasetUploader />
          </div>
        </main>
      </div>
    </div>
  );
}
