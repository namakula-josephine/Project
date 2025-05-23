interface ErrorDisplayProps {
  error: {
    message: string;
    status?: number;
    data?: any;
  };
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  return (
    <div 
      role="alert"
      className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl" aria-hidden="true">⚠️</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">Error</h3>
          <div className="mt-2 text-sm">
            <p>{error.message}</p>
            {error.status && (
              <p className="mt-1 text-xs">Status: {error.status}</p>
            )}
            {error.data && (
              <pre className="mt-2 text-xs overflow-auto max-h-32">
                {JSON.stringify(error.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-3">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-destructive/10 focus:ring-destructive"
              aria-label="Dismiss error"
            >
              <span className="sr-only">Dismiss</span>
              <svg 
                className="h-5 w-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
