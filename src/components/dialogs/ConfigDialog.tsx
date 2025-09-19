import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Settings, FileText } from 'lucide-react';
import { CodexConfig, DEFAULT_CONFIG } from '@/types/codex';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConfigDialogProps {
  isOpen: boolean;
  config: CodexConfig;
  onClose: () => void;
  onSave: (config: CodexConfig) => void;
}

export const ConfigDialog: React.FC<ConfigDialogProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
}) => {
  const [localConfig, setLocalConfig] = useState<CodexConfig>({
    ...config,
  });

  const handleSelectCodexExecutable = async () => {
    try {
      const result = await open({
        multiple: false,
        directory: false
      });
      if (result) {
        setLocalConfig(prev => ({ ...prev, codexPath: result }));
      }
    } catch (error) {
      console.error('Failed to select codex executable:', error);
      alert('Failed to select codex executable: ' + error);
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_CONFIG);
  };

  const updateConfig = (field: keyof CodexConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto sm:!max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Codex 配置
          </DialogTitle>
          <DialogDescription>
            配置 Codex 的设置和偏好
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6">
          {/* Codex Executable Path */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Codex 可执行文件路径</label>
            <div className="flex gap-2">
              <Input
                value={localConfig.codexPath || ''}
                onChange={(e) => updateConfig('codexPath', e.target.value || undefined)}
                placeholder="自动检测或手动指定 codex 路径"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSelectCodexExecutable}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                浏览
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              codex 可执行文件路径。留空则在常见位置（如 ~/.bun/bin/codex）自动检测。
            </p>
          </div>

          {/* Security Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">安全设置</h3>
            
            {/* Approval Policy */}
            <div className="space-y-2">
              <label className="text-sm font-medium">审批策略</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'untrusted', label: '不信任' },
                  { value: 'on-failure', label: '失败时' },
                  { value: 'on-request', label: '按需' },
                  { value: 'never', label: '从不' },
                ].map((policy) => (
                  <Button
                    key={policy.value}
                    variant={localConfig.approvalPolicy === policy.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig('approvalPolicy', policy.value)}
                  >
                    {policy.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Arguments */}
          <div className="space-y-2">
            <label className="text-sm font-medium">自定义参数（高级）</label>
            <Input
              value={localConfig.customArgs?.join(' ') || ''}
              onChange={(e) => updateConfig('customArgs', e.target.value.split(' ').filter(arg => arg.trim()))}
              placeholder="--config foo=bar --profile dev"
            />
            <p className="text-xs text-gray-500">
              传递给 codex 的其他命令行参数
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleReset}>
            重置为默认
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存配置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
