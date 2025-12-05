
import React, { useState, useEffect } from 'react';
import { Play, AlertCircle, Keyboard, Timer, Volume2, ShieldCheck, Smartphone } from 'lucide-react';
import Button from './Button';
import { APP_CONFIG } from '../constants';
import { UserDemographics } from '../types';

interface WelcomeScreenProps {
  onStart: (demographics: UserDemographics) => void;
  initialDemographics?: UserDemographics | null;
}

const getPhaseDurationLabel = (phaseIndex: number) => {
  const phase = APP_CONFIG.phases[phaseIndex];
  if (!phase) return '';
  const seconds = phase.duration / 1000;
  if (seconds >= 60) {
    return `${Math.round(seconds / 60)} 分钟`;
  }
  return `${seconds} 秒`;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, initialDemographics }) => {
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  useEffect(() => {
    if (initialDemographics) {
      setAge(initialDemographics.age.toString());
      setGender(initialDemographics.gender);
    }
  }, [initialDemographics]);

  const isValid = age !== '' && !isNaN(Number(age)) && Number(age) >= 6 && Number(age) <= 90 && gender !== '';

  const handleStart = () => {
    if (isValid) {
      onStart({
        age: Number(age),
        gender: gender as 'male' | 'female'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center space-y-8 p-4 md:p-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
          CPT 注意力持续性测试
        </h1>
        <p className="text-lg md:text-xl text-gray-400">
          视听整合持续性注意力测试 (v2.1 模拟常模版)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Instructions */}
        <div className="bg-surface rounded-xl p-6 border border-gray-700 text-left shadow-2xl space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            测试流程说明
          </h3>
          
          <div className="space-y-4">
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold shrink-0">1</div>
               <div>
                 <div className="text-blue-200 font-medium">视觉测试 ({getPhaseDurationLabel(0)})</div>
                 <div className="text-sm text-gray-400">看到 <strong className="text-white">X</strong> 按反应键，看到 <strong className="text-white">O</strong> 不按。</div>
               </div>
             </div>
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-green-900/50 flex items-center justify-center text-green-400 font-bold shrink-0">2</div>
               <div>
                 <div className="text-green-200 font-medium">休息阶段 ({getPhaseDurationLabel(1)})</div>
                 <div className="text-sm text-gray-400">放松眼睛，无需操作。</div>
               </div>
             </div>
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400 font-bold shrink-0">3</div>
               <div>
                 <div className="text-purple-200 font-medium">听觉替代 ({getPhaseDurationLabel(2)})</div>
                 <div className="text-sm text-gray-400">看到 <strong className="text-white">S (图)</strong> 按反应键，其他不按。</div>
               </div>
             </div>
          </div>

          <div className="h-px bg-gray-700 my-2" />
          
          <div className="flex flex-col gap-3 bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Keyboard className="w-5 h-5 text-gray-500 shrink-0" />
              <span>PC端请将手指轻放在 <strong className="text-white border-b border-gray-600">空格键 (SPACE)</strong> 上准备。</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Smartphone className="w-5 h-5 text-gray-500 shrink-0" />
              <span>手机端请用手指<strong className="text-white border-b border-gray-600">点击屏幕任意位置</strong>进行反应。</span>
            </div>
          </div>
        </div>

        {/* Right Column: User Input */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface rounded-xl p-6 border border-blue-900/30 shadow-2xl flex flex-col justify-center h-full">
            <h3 className="text-lg font-semibold text-white mb-6">受测者基础信息</h3>
            <p className="text-sm text-gray-400 mb-6">
              为了确保算法准确性，我们需要调用内置的常模数据（6-90岁）。
              <br/>请填写准确的年龄和性别。
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">年龄 (Age)</label>
                <input 
                  type="number" 
                  min="6" 
                  max="90"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="请输入年龄 (6-90)"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">性别 (Gender)</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setGender('male')}
                    className={`p-3 rounded-lg border transition-all ${gender === 'male' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                  >
                    男 (Male)
                  </button>
                  <button 
                    onClick={() => setGender('female')}
                    className={`p-3 rounded-lg border transition-all ${gender === 'female' ? 'bg-pink-600 border-pink-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                  >
                    女 (Female)
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button 
                onClick={handleStart} 
                className="w-full text-lg py-4"
                disabled={!isValid}
              >
                <Play className="w-5 h-5 mr-2" />
                {isValid ? '开始测评' : '请完善信息'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Disclaimer Footer */}
      <div className="flex items-start justify-center gap-3 text-left bg-gray-900/50 p-4 rounded-lg border border-gray-800 max-w-2xl mx-auto">
        <ShieldCheck className="w-8 h-8 text-green-500 shrink-0" />
        <div>
          <h4 className="text-green-500 font-bold text-sm mb-1">🔒 隐私安全声明 (Privacy Guarantee)</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            本程序完全基于 <strong>纯前端 (Client-Side)</strong> 运行，所有计算（包括常模匹配）均在您的浏览器本地完成。
            <strong>我们不会收集、上传或存储您的任何个人信息或测试数据。</strong>
            您可以断开网络进行测试以验证安全性。
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
