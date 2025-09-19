import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WebPreviewProps {
  url: string;
  onClose: () => void;
  onUrlChange?: (url: string) => void;
}

export const WebPreview: React.FC<WebPreviewProps> = ({
  url,
  onClose,
  onUrlChange
}) => {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [inputUrl, setInputUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setCurrentUrl(url);
    setInputUrl(url);
  }, [url]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Force iframe reload by changing key
    const iframe = document.querySelector('#web-preview-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl !== currentUrl) {
      setCurrentUrl(inputUrl);
      onUrlChange?.(inputUrl);
    }
  };

  const handleOpenExternal = () => {
    if (typeof window !== 'undefined') {
      window.open(currentUrl, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
        <Globe className="w-4 h-4 text-muted-foreground" />
        <form onSubmit={handleUrlSubmit} className="flex-1 flex gap-1">
          <Input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="输入 URL..."
            className="text-xs h-7"
          />
          {inputUrl !== currentUrl && (
            <Button type="submit" size="sm" variant="ghost" className="h-7 px-2">
              前往
            </Button>
          )}
        </form>
        <Button
          onClick={handleRefresh}
          size="sm"
          variant="ghost"
          disabled={isLoading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        <Button
          onClick={handleOpenExternal}
          size="sm" 
          variant="ghost"
          className="h-7 w-7 p-0"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
        <Button
          onClick={onClose}
          size="sm"
          variant="ghost" 
          className="h-7 w-7 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative overflow-hidden">
        {currentUrl ? (
          <iframe
            id="web-preview-iframe"
            src={currentUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="网页预览"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">输入一个 URL 进行预览</p>
              <p className="text-xs mt-1">非常适合预览 Next.js、React 应用等</p>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};
