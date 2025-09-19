import React, { useState } from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { CodexConfig, SANDBOX_MODES } from '@/types/codex';

interface SandboxProps {
  sandboxMode: CodexConfig['sandboxMode'];
  onModeChange: (mode: CodexConfig['sandboxMode']) => void;
}

export const Sandbox: React.FC<SandboxProps> = ({
  sandboxMode,
  onModeChange
}) => {
  const currentMode = SANDBOX_MODES[sandboxMode];
  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
        >
          <Bot className="w-4 h-4" /> {currentMode.shortLabel}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <span className='p-2'>切换模式</span>
        <TooltipProvider>
          {(Object.entries(SANDBOX_MODES) as [CodexConfig['sandboxMode'], typeof SANDBOX_MODES[CodexConfig['sandboxMode']]][]).map(([value, mode]) => (
            <Tooltip key={value}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => {
                    onModeChange(value);
                    setOpen(false);
                  }}
                  className={`flex items-center p-3 cursor-pointer hover:bg-accent transition-colors ${
                    sandboxMode === value ? 'bg-accent' : ''
                  }`}
                >
                  <div className="font-medium">{mode.shortLabel}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{mode.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
};
