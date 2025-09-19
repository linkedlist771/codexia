import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageSummary, calculateUsageSummary } from "@/utils/usageAnalysis";
import { SummaryCard } from "@/components/usage/SummaryCard";
import { TokenBreakdownCard } from "@/components/usage/TokenBreakdownCard";
import { MostUsedModelsCard } from "@/components/usage/MostUsedModelsCard";
import { TopProjectsCard } from "@/components/usage/TopProjectsCard";
import { ModelUsageChart } from "@/components/usage/ModelUsageChart";
import { ProjectUsageChart } from "@/components/usage/ProjectUsageChart";
import { TimelineChart } from "@/components/usage/TimelineChart";
import { TokenDistributionChart } from "@/components/usage/TokenDistributionChart";


function formatCurrency(amount: number): string {
  return `$${amount.toFixed(3)}`;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  } else if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}


export default function UsagePage() {
  const [usageData, setUsageData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await calculateUsageSummary();
      setUsageData(data);
    } catch (err) {
      console.error('Failed to load usage data:', err);
      setError('Failed to load usage data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsageData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadUsageData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载用量数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadUsageData}>重试</Button>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">暂无用量数据</p>
          <Button onClick={loadUsageData}>刷新</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">用量看板</h1>
          <p className="text-slate-400 mt-1">查看 Codex 用量及费用</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
        >
          {refreshing ? '正在刷新...' : '刷新'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard 
          title="总费用" 
          value={formatCurrency(usageData.totalCost)} 
          description="预计花费"
          accent="text-emerald-400"
        />
        <SummaryCard 
          title="会话总数" 
          value={formatNumber(usageData.totalSessions)} 
          description="已完成的对话"
          accent="text-cyan-400"
        />
        <SummaryCard 
          title="总 Tokens" 
          value={formatTokens(usageData.totalTokens)} 
          description="输入 + 输出 tokens"
          accent="text-purple-400"
        />
        <SummaryCard 
          title="平均每会话成本" 
          value={formatCurrency(usageData.avgCostPerSession)} 
          description="每次对话"
          accent="text-orange-400"
        />
      </div>

      {/* Detailed Views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card border-border">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400">总览</TabsTrigger>
          <TabsTrigger value="models" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400">按模型</TabsTrigger>
          <TabsTrigger value="projects" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400">按项目</TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400">时间线</TabsTrigger>
          <TabsTrigger value="tokens" className="data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 text-slate-400">Token 构成</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TokenBreakdownCard usageData={usageData} formatTokens={formatTokens} />
            <MostUsedModelsCard usageData={usageData} formatCurrency={formatCurrency} formatTokens={formatTokens} />
          </div>

          <TopProjectsCard usageData={usageData} formatCurrency={formatCurrency} formatTokens={formatTokens} />
        </TabsContent>

        <TabsContent value="models">
          <ModelUsageChart usageData={usageData} formatCurrency={formatCurrency} formatTokens={formatTokens} />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectUsageChart usageData={usageData} formatCurrency={formatCurrency} formatTokens={formatTokens} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineChart usageData={usageData} formatCurrency={formatCurrency} formatTokens={formatTokens} />
        </TabsContent>

        <TabsContent value="tokens">
          <TokenDistributionChart usageData={usageData} formatTokens={formatTokens} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
