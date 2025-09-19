import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Provider, useProvidersStore } from "@/stores/ProvidersStore";

interface ProviderModelsProps {
  selectedProvider: string;
}

export default function ProviderModels({ selectedProvider }: ProviderModelsProps) {
  const {
    providers,
    setProviderApiKey,
    setProviderBaseUrl,
    setProviderModels,
  } = useProvidersStore();
  const [newModelName, setNewModelName] = useState("");
  const [editingModelIdx, setEditingModelIdx] = useState<number | null>(null);
  const [editingModelValue, setEditingModelValue] = useState("");

  const handleAddModel = () => {
    const trimmed = newModelName.trim();
    if (!trimmed) return;
    const provider = selectedProvider as Provider;
    if ((providers[provider]?.models || []).includes(trimmed)) {
      setNewModelName("");
      return;
    }
    setProviderModels(provider, [
      ...(providers[provider]?.models || []),
      trimmed,
    ]);
    setNewModelName("");
  };

  const handleEditModel = (idx: number) => {
    const trimmed = editingModelValue.trim();
    if (!trimmed) return;
    const provider = selectedProvider as Provider;
    const newModels = [...(providers[provider]?.models || [])];
    newModels[idx] = trimmed;
    setProviderModels(provider, newModels);
    setEditingModelIdx(null);
    setEditingModelValue("");
  };

  const handleDeleteModel = (idx: number) => {
    const provider = selectedProvider as Provider;
    const newModels = (providers[provider]?.models || []).filter((_, i) => i !== idx);
    setProviderModels(provider, newModels);
  };

  return (
    <Card className="col-span-2">
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-4">
          {selectedProvider} 模型
        </h2>
        <div className="mb-4">
          <label className="block mb-1 font-medium">API 密钥</label>
          <Input
            type="password"
            value={providers[selectedProvider as Provider]?.apiKey || ""}
            onChange={(e) =>
              setProviderApiKey(selectedProvider as Provider, e.target.value)
            }
            placeholder={`请输入 ${selectedProvider} 的 API 密钥`}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">基础地址</label>
          <Input
            type="text"
            value={providers[selectedProvider as Provider]?.baseUrl || ""}
            onChange={(e) =>
              setProviderBaseUrl(selectedProvider as Provider, e.target.value)
            }
            placeholder={`请输入 ${selectedProvider} 的基础地址`}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium">模型列表</label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddModel();
                }
              }}
              placeholder="添加新模型"
              className="flex-1"
            />
            <Button onClick={handleAddModel}>
              添加
            </Button>
          </div>
          <ul className="list-disc list-inside mb-2">
            {(providers[selectedProvider as Provider]?.models || []).map(
              (model, idx) => (
                <li
                  key={model + idx}
                  className="flex items-center justify-between py-1"
                >
                  {editingModelIdx === idx ? (
                    <div className="flex gap-2 flex-1">
                      <Input
                        type="text"
                        value={editingModelValue}
                        onChange={(e) =>
                          setEditingModelValue(e.target.value)
                        }
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleEditModel(idx)}
                      >
                        保存
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setEditingModelIdx(null);
                          setEditingModelValue("");
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span>{model}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingModelIdx(idx);
                            setEditingModelValue(model);
                          }}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteModel(idx)}
                        >
                          删除
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ),
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
