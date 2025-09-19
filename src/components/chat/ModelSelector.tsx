import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { useProvidersStore } from '@/stores/ProvidersStore';
import { useModelStore } from '@/stores/ModelStore';
import { ConfigService } from '@/services/configService';

export const ModelSelector: React.FC = () => {
  const { providers } = useProvidersStore();
  const { currentModel, currentProvider, setCurrentModel } = useModelStore();
  const [modelsByProvider, setModelsByProvider] = useState<Record<string, Array<{model: string, source: 'settings' | 'config'}>>>({});
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(currentProvider.toLowerCase());

  // Load available models grouped by provider
  useEffect(() => {
    const loadModelsByProvider = async () => {
      const providerModels: Record<string, Array<{model: string, source: 'settings' | 'config'}>> = {};
      
      // Add models from settings store
      Object.entries(providers).forEach(([providerName, providerConfig]) => {
        const normalizedProvider = providerName.toLowerCase();
        if (!providerModels[normalizedProvider]) {
          providerModels[normalizedProvider] = [];
        }
        
        if (providerConfig?.models) {
          providerConfig.models.forEach(model => {
            // Check for duplicates within the same provider
            const exists = providerModels[normalizedProvider].some(m => m.model === model);
            if (!exists) {
              providerModels[normalizedProvider].push({
                model,
                source: 'settings'
              });
            }
          });
        }
      });
      
      // Add models from config.toml profiles
      try {
        const profiles = await ConfigService.getAllProfiles();
        Object.entries(profiles).forEach(([, profile]) => {
          const normalizedProvider = profile.model_provider.toLowerCase();
          if (!providerModels[normalizedProvider]) {
            providerModels[normalizedProvider] = [];
          }
          
          // Check for duplicates within the same provider
          const exists = providerModels[normalizedProvider].some(m => m.model === profile.model);
          if (!exists) {
            providerModels[normalizedProvider].push({
              model: profile.model,
              source: 'config'
            });
          }
        });
      } catch (error) {
        console.error('Failed to load config.toml profiles:', error);
      }
      
      setModelsByProvider(providerModels);
    };
    
    loadModelsByProvider();
  }, [providers]);

  // Helper function to determine if provider should use OSS
  const shouldUseOss = (provider: string) => {
    return provider.toLowerCase() === 'ollama';
  };

  // Get available providers
  const availableProviders = useMemo(() => {
    return Object.keys(modelsByProvider).sort();
  }, [modelsByProvider]);

  // Update selectedProvider when modelsByProvider changes
  useEffect(() => {
    if (availableProviders.length > 0 && !availableProviders.includes(selectedProvider)) {
      setSelectedProvider(availableProviders[0]);
    }
  }, [availableProviders, selectedProvider]);

  // Get models for selected provider
  const selectedProviderModels = useMemo(() => {
    const models = modelsByProvider[selectedProvider] || [];
    if (!searchTerm.trim()) {
      return models;
    }
    return models.filter(modelInfo => 
      modelInfo.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [modelsByProvider, selectedProvider, searchTerm]);

  return (
    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
      <Popover open={isModelPopoverOpen} onOpenChange={(open) => {
        setIsModelPopoverOpen(open);
        if (!open) {
          setSearchTerm('');
        }
      }}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 h-6 px-2">
              {currentProvider} • {currentModel}
            </Badge>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800" align="end">
          <div className="flex h-80">
            {/* Left Provider Sidebar */}
            <div className="w-36 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h4 className="font-medium text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide">提供商</h4>
              </div>
              <div className="p-1">
                {availableProviders.map((providerName) => (
                  <button
                    key={providerName}
                    onClick={() => setSelectedProvider(providerName)}
                    className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                      selectedProvider === providerName
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{providerName}</span>
                      {shouldUseOss(providerName) && (
                        <span className="text-xs text-gray-400">OSS</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Model List */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">{selectedProvider} 的模型</h4>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <Input
                    placeholder="搜索模型..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {selectedProviderModels.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 p-2 text-center">
                    {searchTerm.trim() ? '没有匹配的模型' : '暂无可用模型'}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {selectedProviderModels.map((modelInfo, index) => (
                      <Button
                        key={`${selectedProvider}-${modelInfo.model}-${index}`}
                        variant={currentModel === modelInfo.model && currentProvider.toLowerCase() === selectedProvider ? "default" : "ghost"}
                        className="w-full justify-start text-left h-auto p-2"
                        onClick={() => {
                          setCurrentModel(modelInfo.model, selectedProvider);
                          setIsModelPopoverOpen(false);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">{modelInfo.model}</span>
                          <Badge 
                            variant={modelInfo.source === 'config' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {modelInfo.source === 'config' ? '配置' : '设置'}
                          </Badge>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 可在“设置”中添加更多提供商，或直接编辑 ~/.codex/config.toml
                </p>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <div></div>
    </div>
  );
};
