interface UploadProgressProps {
  progress: number;
  fileName?: string;
  status?: 'uploading' | 'processing' | 'done' | 'error';
  error?: string;
}

export function UploadProgress({ progress, fileName, status = 'uploading', error }: UploadProgressProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const statusColor =
    status === 'error' ? 'bg-destructive' :
    status === 'done' ? 'bg-green-500' :
    'bg-primary';

  return (
    <div className="space-y-1" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      {fileName && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground truncate max-w-[200px]">{fileName}</span>
          <span className="text-muted-foreground">{clamped}%</span>
        </div>
      )}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${statusColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {status === 'processing' && (
        <p className="text-xs text-muted-foreground animate-pulse">Processing file...</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
