import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setLoading(true);
      const newUrls: string[] = [];

      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post('/files/upload', formData);

        newUrls.push(data.url);
      }

      onChange([...value, ...newUrls]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setLoading(false);
    }
  }, [value, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: disabled || loading,
    multiple: true
  });

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  const handleSetMain = (urlToMakeMain: string) => {
    const newUrls = [urlToMakeMain, ...value.filter((url) => url !== urlToMakeMain)];
    onChange(newUrls);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 hover:bg-secondary/50 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center h-32",
          isDragActive && "border-primary bg-secondary/50",
          (disabled || loading) && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-6 w-6 text-muted-foreground" />
        )}
        <div className="text-sm text-muted-foreground">
          {loading ? "Subiendo..." : "Arrastra imágenes aquí o haz clic para seleccionar"}
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={url} className="relative aspect-square rounded-md overflow-hidden border group">
              <div className="absolute top-2 left-2 z-10">
                {index === 0 ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">Principal</Badge>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleSetMain(url)}
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 text-xs px-2"
                  >
                    Hacer Principal
                  </Button>
                )}
              </div>
              <Button
                type="button"
                onClick={() => handleRemove(url)}
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={url}
                alt="Product"
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
