
import React, { useMemo } from 'react';
import { TrialData, TestResultMetrics, UserDemographics } from '../types';
import { analyzeResults, calculatePercentile, getNormAgeGroup } from '../utils/scoring';
import { Download, RefreshCw, AlertTriangle, CheckCircle, Info, FileText, Camera, User, Clock, Calendar } from 'lucide-react';
import Button from './Button';

interface ResultsScreenProps {
  data: TrialData[];
  extraClicks: number;
  user: UserDemographics;
  onRestart: () => void;
}

const RISK_LEVELS = {
  LOW: { label: '低风险 (正常)', color: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500' },
  MED: { label: '中风险 (需关注)', color: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500' },
  HIGH: { label: '高风险 (建议咨询)', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500' }
};

const getRiskLevel = (probability: number) => {
  if (probability < 30) return RISK_LEVELS.LOW;
  if (probability < 60) return RISK_LEVELS.MED;
  return RISK_LEVELS.HIGH;
};

// --- BELL CURVE CHART COMPONENT ---
const BellCurveChart: React.FC<{ scores: { label: string, t: number, color: string }[] }> = ({ scores }) => {
  // SVG Config
  const width = 600;
  const height = 200;
  const padding = 20;
  
  // Normal Distribution Formula: y = e^(-0.5 * x^2)
  // Map T-Scores (0 to 100) to X coordinates.
  // Mean T=50. SD=10.
  // X range from T=10 (z=-4) to T=90 (z=4).
  
  const tToX = (t: number) => {
    return ((t - 10) / 80) * (width - 2 * padding) + padding;
  };
  
  const generatePath = () => {
    let path = `M ${padding} ${height - padding}`;
    for (let t = 10; t <= 90; t += 1) {
      const z = (t - 50) / 10;
      const yVal = Math.exp(-0.5 * z * z);
      const yPixel = (height - padding) - (yVal * (height - 2 * padding));
      path += ` L ${tToX(t)} ${yPixel}`;
    }
    return path;
  };

  return (
    <div className="w-full overflow-hidden bg-gray-900/50 rounded-xl border border-gray-700 relative p-4">
      <h4 className="text-gray-400 text-xs uppercase tracking-wider mb-4 text-center">常模正态分布对比 (T-Score Distribution)</h4>
      <div className="relative w-full aspect-[3/1]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Background Zones */}
          {/* Risk < 30 */}
          <rect x={tToX(10)} y="0" width={tToX(30) - tToX(10)} height={height} fill="#EF4444" fillOpacity="0.1" />
          {/* Borderline 30-40 */}
          <rect x={tToX(30)} y="0" width={tToX(40) - tToX(30)} height={height} fill="#EAB308" fillOpacity="0.1" />
          {/* Normal 40-60 */}
          <rect x={tToX(40)} y="0" width={tToX(60) - tToX(40)} height={height} fill="#22C55E" fillOpacity="0.1" />
          {/* High > 60 */}
          <rect x={tToX(60)} y="0" width={tToX(90) - tToX(60)} height={height} fill="#3B82F6" fillOpacity="0.1" />

          {/* Bell Curve */}
          <path d={generatePath()} fill="none" stroke="#6B7280" strokeWidth="2" />
          
          {/* Axis Line */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#4B5563" strokeWidth="1" />
          
          {/* Mean Line */}
          <line x1={tToX(50)} y1={padding} x2={tToX(50)} y2={height - padding} stroke="#4B5563" strokeDasharray="4 4" />
          <text x={tToX(50)} y={height - 5} fill="#6B7280" fontSize="10" textAnchor="middle">均值 (T=50)</text>

          {/* User Scores */}
          {scores.map((s, i) => (
             <g key={i}>
                <line x1={tToX(s.t)} y1={padding + 20} x2={tToX(s.t)} y2={height - padding} stroke={s.color} strokeWidth="2" />
                <circle cx={tToX(s.t)} cy={padding + 20} r="4" fill={s.color} />
                <text x={tToX(s.t)} y={padding + 10} fill={s.color} fontSize="10" textAnchor="middle" fontWeight="bold">{s.label}</text>
             </g>
          ))}
        </svg>
      </div>
      <div className="flex justify-center gap-4 mt-2 text-[10px] text-gray-500">
         <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500/30 rounded-full"></div> 风险 (&lt;30)</span>
         <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500/30 rounded-full"></div> 边缘 (30-40)</span>
         <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500/30 rounded-full"></div> 正常 (40-60)</span>
      </div>
    </div>
  );
};


const ResultsScreen: React.FC<ResultsScreenProps> = ({ data, extraClicks, user, onRestart }) => {
  
  const metrics: TestResultMetrics = useMemo(() => {
    return analyzeResults(data, extraClicks, user);
  }, [data, extraClicks, user]);

  const { simulated } = metrics;
  const risk = getRiskLevel(simulated.riskProbability);
  const normGroup = getNormAgeGroup(user.age);
  const totalDuration = Math.round((data[data.length-1]?.timestamp || 0) / 1000 / 60); // approx min

  // Calculate Average T-Scores across Vis/Aud for summary
  const tVig = Math.round((simulated.visual.vigilance + simulated.auditory.vigilance) / 2);
  const tSpd = Math.round((simulated.visual.speed + simulated.auditory.speed) / 2);
  const tFoc = Math.round((simulated.visual.focus + simulated.auditory.focus) / 2);
  const tPru = Math.round((simulated.visual.prudence + simulated.auditory.prudence) / 2);

  const scorePoints = [
    { label: '警觉', t: tVig, color: '#F87171' }, // Red-400
    { label: '速度', t: tSpd, color: '#60A5FA' }, // Blue-400
    { label: '专注', t: tFoc, color: '#A78BFA' }, // Purple-400
    { label: '慎重', t: tPru, color: '#34D399' }, // Emerald-400
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-24">
      
      {/* 1. WARNING BANNER */}
      <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 flex items-center justify-center gap-3 text-yellow-200 text-sm">
         <AlertTriangle className="w-4 h-4" />
         <span>⚠️ 注意：数据未保存！刷新或关闭页面后结果将永久消失。请立即截图保存。</span>
      </div>

      <div className="text-center space-y-1 mb-8">
        <h2 className="text-3xl font-bold text-white">V2.1 综合测评报告</h2>
        <p className="text-gray-400 text-sm">Norm-Referenced CPT Analysis Report</p>
      </div>

      {/* 2. REPORT HEADER INFO */}
      <div className="bg-surface rounded-xl border border-gray-700 p-6 shadow-lg">
         <div className="flex items-center gap-2 mb-4 text-blue-400 font-bold border-b border-gray-700 pb-2">
            <FileText className="w-5 h-5" />
            <h3>📄 报告基本信息</h3>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
               <div className="text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3"/> 测试对象</div>
               <div className="text-white font-medium">{user.gender === 'male' ? '男性' : '女性'} / {user.age}岁</div>
            </div>
            <div>
               <div className="text-gray-500 mb-1 flex items-center gap-1"><Info className="w-3 h-3"/> 常模组别</div>
               <div className="text-white font-medium">{normGroup}</div>
            </div>
            <div>
               <div className="text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> 测试时长</div>
               <div className="text-white font-medium">约 15 分钟</div>
            </div>
             <div>
               <div className="text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> 测试日期</div>
               <div className="text-white font-medium">{new Date().toLocaleDateString()}</div>
            </div>
         </div>
      </div>

      {/* 3. RISK GAUGE & S-SCORE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* S-Score Gauge */}
        <div className="md:col-span-1 bg-surface p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center">
            <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#374151" strokeWidth="10" fill="transparent" />
              <circle 
                cx="80" cy="80" r="70" 
                stroke="currentColor" 
                strokeWidth="10" 
                fill="transparent" 
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * simulated.riskProbability) / 100}
                className={`${risk.color} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${risk.color}`}>{simulated.riskProbability}%</span>
              <span className="text-xs text-gray-500 mt-1">S 风险指数</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${risk.border} ${risk.color} bg-opacity-10 bg-gray-900`}>
                {risk.label}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center leading-relaxed">
             <strong>解读说明：</strong> 该指数反映了测试对象在各项指标上，<strong>相较于{normGroup}常模群体</strong>的偏离程度。如果该值较高，表示表现出与常模<strong>显著不同</strong>的行为模式。
          </p>
        </div>

        {/* 4. BELL CURVE CHART */}
        <div className="md:col-span-2 space-y-6">
           <BellCurveChart scores={scorePoints} />
        </div>
      </div>

      {/* 5. METRIC DETAILS TABLE */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
           <Info className="w-5 h-5 text-blue-400" />
           各项指标详细数据 (T-Score & Percentile)
        </h3>
        <div className="bg-surface rounded-xl border border-gray-700 overflow-hidden">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-800 text-gray-400 uppercase font-mono text-xs">
                 <tr>
                    <th className="px-6 py-4 font-medium">指标名称 (Metric)</th>
                    <th className="px-6 py-4 font-medium text-center">用户得分 (T-Score)</th>
                    <th className="px-6 py-4 font-medium text-center">常模百分位 (Percentile)</th>
                    <th className="px-6 py-4 font-medium text-right">评级 (Rating)</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                 <MetricRow 
                   label="注意力持续力 (T_OM)" 
                   sublabel="Vigilance / Omissions"
                   tScore={tVig} 
                 />
                 <MetricRow 
                   label="反应速度 (T_RT)" 
                   sublabel="Speed / Response Time"
                   tScore={tSpd} 
                 />
                 <MetricRow 
                   label="冲动控制 (T_CM)" 
                   sublabel="Prudence / Commissions"
                   tScore={tPru} 
                 />
                 <MetricRow 
                   label="稳定性 (T_SD)" 
                   sublabel="Focus / Variability"
                   tScore={tFoc} 
                 />
              </tbody>
           </table>
        </div>
      </div>

      {/* 6. SAVE GUIDE */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mt-8 text-center">
        <h4 className="text-white font-bold mb-4 flex items-center justify-center gap-2">
          <Camera className="w-5 h-5" />
          如何保存报告？
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 text-left max-w-2xl mx-auto">
          <div className="bg-gray-900 p-3 rounded">
            <strong className="text-gray-200 block mb-1">💻 电脑端</strong>
            按 <code className="bg-gray-800 px-1 rounded">Ctrl + P</code> 打印并选择 "另存为 PDF"，或直接使用截图工具。
          </div>
          <div className="bg-gray-900 p-3 rounded">
             <strong className="text-gray-200 block mb-1">📱 手机端</strong>
             请直接使用手机自带的截屏功能保存图片。
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={onRestart} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          结束并清除数据
        </Button>
      </div>
    </div>
  );
};

// Helper Row Component
const MetricRow: React.FC<{ label: string, sublabel: string, tScore: number }> = ({ label, sublabel, tScore }) => {
   const percentile = calculatePercentile(tScore);
   
   let rating = '正常范围';
   let color = 'text-green-400';
   
   if (tScore < 30) {
      rating = '⚠️ 显著落后 (风险)';
      color = 'text-red-500 font-bold';
   } else if (tScore < 40) {
      rating = '边缘水平';
      color = 'text-yellow-500';
   } else if (tScore > 60) {
      rating = '高于平均';
      color = 'text-blue-400';
   }

   const suffix = (() => {
      const p = percentile;
      if (p === 11 || p === 12 || p === 13) return 'th';
      const last = p % 10;
      if (last === 1) return 'st';
      if (last === 2) return 'nd';
      if (last === 3) return 'rd';
      return 'th';
   })();

   return (
      <tr className="hover:bg-gray-800/50 transition-colors">
         <td className="px-6 py-4">
            <div className="text-white font-medium">{label}</div>
            <div className="text-xs text-gray-500">{sublabel}</div>
         </td>
         <td className="px-6 py-4 text-center">
            <span className={`inline-block px-3 py-1 rounded bg-gray-900 font-mono ${color}`}>
               {tScore}
            </span>
         </td>
         <td className="px-6 py-4 text-center text-gray-300 font-mono">
            {percentile}<span className="text-xs text-gray-500 align-top">{suffix}</span>
         </td>
         <td className={`px-6 py-4 text-right ${color}`}>
            {rating}
         </td>
      </tr>
   );
};

export default ResultsScreen;
