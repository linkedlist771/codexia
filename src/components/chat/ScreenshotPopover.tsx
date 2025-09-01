import React, { useState, useEffect } from 'react';
import { Camera, Monitor, Square } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { 
  getScreenshotableWindows, 
  getScreenshotableMonitors,
  getWindowScreenshot,
  getMonitorScreenshot,
  type ScreenshotableWindow,
  type ScreenshotableMonitor
} from 'tauri-plugin-screenshots-api';

interface ScreenshotPopoverProps {
  onScreenshotTaken: (path: string) => void;
}

export const ScreenshotPopover: React.FC<ScreenshotPopoverProps> = ({
  onScreenshotTaken,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [windows, setWindows] = useState<ScreenshotableWindow[]>([]);
  const [monitors, setMonitors] = useState<ScreenshotableMonitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadScreenshotableItems = async () => {
    try {
      setIsLoading(true);
      const [allWindows, monitorList] = await Promise.all([
        getScreenshotableWindows(),
        getScreenshotableMonitors()
      ]);

      // Filter out system windows and keep only user applications
      const systemApps = new Set([
        'Control Center',
        'Window Server', 
        'Dock',
        'SystemUIServer',
        'TextInputMenuAgent',
        'Spotlight',
        'Finder',
        'loginwindow',
        'WindowManager',
        'CoreServicesUIAgent'
      ]);
      
      const userWindows = allWindows.filter(window => {
        // Filter out system apps
        if (systemApps.has(window.appName)) return false;
        
        // Filter out windows with generic names that are likely system windows
        if (window.name.includes('Item-0') || 
            window.name.includes('StageManager') ||
            window.name.includes('NowPlaying') ||
            window.name.includes('BentoBox') ||
            window.name.includes('WiFi') ||
            window.name.includes('Clock') ||
            window.name.includes('Menubar')) {
          return false;
        }
        
        return true;
      });

      // Group windows by app name and keep only the main window for each app
      const appMap = new Map();
      userWindows.forEach(window => {
        const existing = appMap.get(window.appName);
        if (!existing || window.name.length > existing.name.length) {
          // Prefer windows with longer names (usually main windows)
          appMap.set(window.appName, window);
        }
      });
      
      const uniqueApps = Array.from(appMap.values());
      setWindows(uniqueApps);
      setMonitors(monitorList);
    } catch (error) {
      console.error('Failed to load screenshotable items:', error);
      setWindows([]);
      setMonitors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadScreenshotableItems();
    }
  }, [isOpen]);

  const takeMonitorScreenshot = async (monitor: ScreenshotableMonitor) => {
    try {
      setIsCapturing(true);
      setIsOpen(false);

      const screenshotPath = await getMonitorScreenshot(monitor.id);
      onScreenshotTaken(screenshotPath);
    } catch (error) {
      console.error('Failed to take monitor screenshot:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const takeWindowScreenshot = async (window: ScreenshotableWindow) => {
    try {
      setIsCapturing(true);
      setIsOpen(false);

      const screenshotPath = await getWindowScreenshot(window.id);
      onScreenshotTaken(screenshotPath);
    } catch (error) {
      console.error('Failed to take window screenshot:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-0 hover:bg-muted/50"
          disabled={isCapturing}
        >
          <Camera className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-sm text-muted-foreground px-2 py-1">
              Loading...
            </div>
          ) : (
            <>
              {/* Monitors section */}
              {monitors.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground px-2 py-1 font-medium">
                    Monitors
                  </div>
                  <div className="space-y-1">
                    {monitors.map((monitor) => (
                      <Button
                        key={monitor.id}
                        onClick={() => takeMonitorScreenshot(monitor)}
                        className="w-full justify-start text-left"
                        variant="ghost"
                        disabled={isCapturing}
                      >
                        <Monitor className="mr-2 h-4 w-4" />
                        <span className="truncate">{monitor.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Windows section */}
              {windows.length > 0 && (
                <div className={monitors.length > 0 ? "border-t pt-2" : ""}>
                  <div className="text-xs text-muted-foreground px-2 py-1 font-medium">
                    Windows
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {windows.map((window) => (
                      <Button
                        key={window.id}
                        onClick={() => takeWindowScreenshot(window)}
                        className="w-full justify-start text-left"
                        variant="ghost"
                        disabled={isCapturing}
                      >
                        <Square className="mr-2 h-3 w-3" />
                        <div className="flex flex-col items-start min-w-0">
                          <span className="truncate text-xs text-muted-foreground">
                            {window.appName}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {monitors.length === 0 && windows.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground px-2 py-1">
                  No screenshots available
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};