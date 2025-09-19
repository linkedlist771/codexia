import { Brain, Clock, Coins, User, Bot } from 'lucide-react';

interface TokenUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  cached_input_tokens?: number;
  reasoning_output_tokens?: number;
}

interface StatusBarProps {
  tokenUsage?: TokenUsage;
  sessionId?: string;
  model?: string;
  isTaskRunning?: boolean;
  lastActivity?: Date;
  className?: string;
}

export function StatusBar({
  tokenUsage,
  sessionId,
  model,
  isTaskRunning = false,
  lastActivity,
  className = ''
}: StatusBarProps) {
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`status-bar bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left side - Session info */}
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
          {sessionId && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="font-mono">
                {sessionId.slice(0, 8)}...
              </span>
            </div>
          )}
          
          {model && (
            <div className="flex items-center gap-1">
              <Bot className="w-3 h-3" />
              <span>{model}</span>
            </div>
          )}
          
          {isTaskRunning && (
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>AI 正在工作</span>
            </div>
          )}
        </div>

        {/* Center - Token usage */}
        {tokenUsage && (
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
            {tokenUsage.input_tokens !== undefined && (
              <div className="flex items-center gap-1">
                <span className="text-green-600 dark:text-green-400">↓</span>
                <span>{formatNumber(tokenUsage.input_tokens)}</span>
              </div>
            )}
            
            {tokenUsage.output_tokens !== undefined && (
              <div className="flex items-center gap-1">
                <span className="text-blue-600 dark:text-blue-400">↑</span>
                <span>{formatNumber(tokenUsage.output_tokens)}</span>
              </div>
            )}
            
            {tokenUsage.reasoning_output_tokens !== undefined && tokenUsage.reasoning_output_tokens > 0 && (
              <div className="flex items-center gap-1">
                <Brain className="w-3 h-3 text-purple-500" />
                <span>{formatNumber(tokenUsage.reasoning_output_tokens)}</span>
              </div>
            )}
            
            {tokenUsage.cached_input_tokens !== undefined && tokenUsage.cached_input_tokens > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-orange-600 dark:text-orange-400">⚡</span>
                <span>{formatNumber(tokenUsage.cached_input_tokens)}</span>
              </div>
            )}
            
            {tokenUsage.total_tokens !== undefined && (
              <div className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                <span className="font-medium">{formatNumber(tokenUsage.total_tokens)}</span>
              </div>
            )}
          </div>
        )}

        {/* Right side - Timing */}
        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
          {lastActivity && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(lastActivity)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
