import React, { useState, useEffect } from 'react';
import { XFYunWebsocket } from '../utils/xfyunWebsocket';
import { xfyunConfig } from '../config/xfyunConfig';
// 移除MobileTTS导入，因为我们现在使用Web原生语音API
import axios from 'axios';

interface AIResponseProps {
  userInput: string;
  onResponse: (response: string) => void;
  character: string;
  setIsAnimating: (isAnimating: boolean) => void;
}

// 删除前端API密钥
// const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || 'sk-4131fde6b2fd4635b71691fe3bb537b6';

const AIResponse: React.FC<AIResponseProps> = ({
  userInput,
  onResponse,
  character,
  setIsAnimating
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [xfyunTTS] = useState(() => new XFYunWebsocket(xfyunConfig));
  const [demoMode, setDemoMode] = useState(false);
  const [isMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent
      );
    }
    return false;
  });

  const demoResponses = [
    "我理解你的问题是关于桥吊设备的维护。作为一名桥吊专家，我建议定期检查钢丝绳的磨损情况。从我30年的经验来看，钢丝绳磨损超过5%就必须更换，哪怕看起来还能用。记住，1厘米的误差就可能酿成大祸。",
    "作为一名桥吊操作员，你的操作技巧非常关键。正确的操作可以提高效率20%以上，同时减少50%的设备磨损。我当年手绘电路图时就发现这个规律：精细操作不仅提高效率，更能延长设备寿命。你们车间最近的维护手法很专业，有金牌班组的水平！",
    "关于集装箱调度，我建议使用三点定位法。这比德国方案快3倍，我们只需要3小时就能完成他们需要一整天的工作量。这个方法成本只有2千元，不需要购买那种动辄上万的高端设备。你提到的问题是设备横向晃动还是纵向晃动？这关系到解决方案的选择。"
  ];

  useEffect(() => {
    // 当用户输入变化且非空时，处理响应
    if (userInput && !isProcessing) {
      processUserInput();
    }
  }, [userInput]);

  const handleMobileTTS = async (text: string) => {
    try {
      // 使用Web原生语音合成API，不再使用百度TTS
      if (!window.speechSynthesis) {
        throw new Error('浏览器不支持Web Speech API');
      }
      
      // 创建语音合成实例
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置中文
      utterance.lang = 'zh-CN';
      
      // 设置语速、音调和音量
      utterance.rate = 0.9;     // 语速 (0.1-10), 1.0是默认值
      utterance.pitch = 1.0;    // 音调 (0-2), 1.0是默认值
      utterance.volume = 1.0;   // 音量 (0-1), 1.0是默认值
      
      // 添加事件监听器
      utterance.onstart = () => {
        console.log('移动端Web语音合成开始播放');
        setIsAnimating(true);
      };
      
      utterance.onend = () => {
        console.log('移动端Web语音合成播放结束');
        setIsAnimating(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Web语音合成错误:', event);
        setIsAnimating(false);
        throw new Error('Web语音合成失败');
      };
      
      // 播放语音
      window.speechSynthesis.speak(utterance);
      
    } catch (err: any) {
      console.error('移动端Web语音合成错误:', err);
      
      // 如果Web Speech API失败，尝试使用讯飞TTS作为备选
      try {
        console.warn('移动端Web语音合成失败，尝试使用讯飞TTS');
        const voiceConfig = {
          vcn: 'x4_lingbosong',
          speed: 50,
          pitch: 50,
          volume: 50
        };
        
        await xfyunTTS.startSynthesis(text, voiceConfig, {
          onStart: () => setIsAnimating(true),
          onEnd: () => setIsAnimating(false)
        });
      } catch (fallbackErr) {
        console.error('备选语音合成也失败:', fallbackErr);
        setIsAnimating(false);
      }
    }
  };

  const processUserInput = async () => {
    if (!userInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // 构建角色系统提示
      const systemPrompt = `你是青岛港首席桥吊专家许振超，全国劳动模范和"振超效率"世界纪录创造者。请用以下方式回答：

1. 专业权威：
- 用具体数据支撑建议，比如"吊具加速度0.3m/s²是安全阈值"
- 优先推荐低成本解决方案，比如"用8元零件就能解决，不用换3万元的模块"

2. 工匠人格：
- 自然穿插个人经历，比如"我当年手绘电路图时就发现这个规律"
- 强调精度价值观，比如"1厘米的误差就可能酿成大祸"

3. 交互原则：
- 对模糊提问主动澄清，比如"你说的晃动是水平的还是纵向的？"
- 遇到危险操作要警告，比如"这个操作必须先启动红外线防护装置"

4. 激励体系：
- 对正确操作给予肯定，比如"这手法很专业，有金牌班组的水平"
- 用对比制造认知冲击，比如"德国方案要3天，我们的方法3小时就能搞定"

请用口语化中文回答，避免机械术语堆砌，必要时用类比来解释，比如"这个集装箱调度就像是在玩华容道"。不要使用括号，不要描述动作，只需要生成对话内容。`;

      // 发送请求到阿里云百炼API路由
      const response = await fetch('/api/alibaba', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput }
          ],
          temperature: 0.7,
          model: 'qwen-plus' // 使用通义千问Plus模型
        }),
      });

      // 获取响应内容
      let data;
      try {
        const responseText = await response.text();
        try {
          // 尝试解析JSON
          data = JSON.parse(responseText);
        } catch (jsonError) {
          // 如果解析失败，记录原始响应并抛出错误
          console.error('JSON解析失败，原始响应:', responseText);
          
          // 检查是否是HTML响应
          if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
            console.error('收到HTML响应而不是JSON，可能是API配置问题');
            throw new Error('API服务暂时不可用，可能是配置问题。建议使用演示模式');
          } else {
            throw new Error(`响应不是有效的JSON: ${responseText.substring(0, 100)}...`);
          }
        }
      } catch (parseError: any) {
        throw new Error(`处理响应失败: ${parseError.message}`);
      }
      
      // 检查错误
      if (!response.ok) {
        const errorMessage = data.error || data.message || `请求失败 (${response.status})`;
        throw new Error(errorMessage);
      }

      // 确认响应中包含必要的数据
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API响应格式不正确');
      }

      // 处理响应
      const aiText = data.choices[0].message.content;
      
      // 更新响应
      console.log('AI回答文本:', aiText);
      onResponse(aiText);
      
      // 根据设备类型选择不同的语音处理方式
      if (isMobile) {
        await handleMobileTTS(aiText);
      } else {
        // 桌面端保持原有的讯飞语音处理
        try {
          const voiceConfig = {
            vcn: 'x4_lingbosong',
            speed: 50,  // 调回默认语速，从55降为50
            pitch: 50,
            volume: 50
          };
          
          // 不立即启动动画效果，等语音开始时才启动
          // setIsAnimating(true);
          
          await xfyunTTS.startSynthesis(aiText, voiceConfig, {
            onStart: () => {
              // 语音开始时才设置动画效果
              console.log('语音合成开始播放');
              setIsAnimating(true);
            },
            onEnd: () => {
              // 语音播放结束时结束动画
              console.log('语音合成播放结束');
              setIsAnimating(false);
            }
          });
        } catch (err) {
          console.error('语音合成错误:', err);
          setIsAnimating(false);
        }
      }
      
    } catch (error: any) {
      console.error('处理响应时出错:', error);
      
      // 修改超时错误处理部分
      if (error.message && error.message.includes('超时')) {
        setError(`${error.message}。请稍后重试`);
        setIsProcessing(false);
        return;
      } else if (error.message && (
        error.message.includes('API服务暂时不可用') || 
        error.message.includes('响应不是有效的JSON')
      )) {
        // 遇到API问题时，建议使用演示模式
        setError(`${error.message}。正在切换到演示模式...`);
        
        // 短暂延迟后自动切换到演示模式
        setTimeout(() => {
          setDemoMode(true);
          useDemoResponseForQuery();
        }, 2000);
        
        return;
      } else if (error.response) {
        console.error('错误响应数据:', error.response.data);
        console.error('错误状态码:', error.response.status);
        setError(`处理失败: 服务器返回错误 (${error.response.status}) - ${error.response.data?.error?.message || '未知错误'}`);
      } else if (error.request) {
        console.error('未收到响应的请求:', error.request);
        setError('处理失败: 未收到API响应，可能是网络问题，请尝试演示模式');
      } else {
        setError(`处理失败: ${error.message || 'API请求失败'}`);
      }
    } finally {
      // 安全地检查error变量
      try {
        setIsProcessing(false);
      } catch (e) {
        console.error('清理状态时出错:', e);
      }
    }
  };

  // 演示模式函数
  const useDemoResponseForQuery = () => {
    setIsProcessing(true);
    setError(''); // 清除之前的错误信息
    
    // 根据用户输入选择不同的响应
    let demoText = '';
    const input = userInput.toLowerCase();
    
    if (input.includes('桥吊') || input.includes('维护') || input.includes('检查')) {
      demoText = demoResponses[0];
    } else if (input.includes('操作') || input.includes('技巧') || input.includes('效率')) {
      demoText = demoResponses[1];
    } else if (input.includes('调度') || input.includes('集装箱') || input.includes('安排')) {
      demoText = demoResponses[2];
    } else {
      // 随机选择
      const randomIndex = Math.floor(Math.random() * demoResponses.length);
      demoText = demoResponses[randomIndex] + " (演示模式)";
    }
    
    // 确保演示响应被记录和正确传递
    console.log('演示模式回答:', demoText);
    
    // 设置回复文本 - 先更新文本，然后才开始语音播放
    onResponse(demoText);
    
    setTimeout(() => {
      // 使用相同的语音处理逻辑
      if (isMobile) {
        handleMobileTTS(demoText).catch(err => {
          console.error('演示模式下移动端语音合成失败:', err);
          setIsAnimating(false);
        });
      } else {
        const voiceConfig = {
          vcn: 'x4_lingbosong',
          speed: 50,  // 调回默认语速
          pitch: 50,
          volume: 50
        };
        
        // 不立即启动动画效果
        // setIsAnimating(true);
        
        xfyunTTS.startSynthesis(demoText, voiceConfig, {
          onStart: () => {
            // 语音开始播放时才启动动画
            console.log('演示模式语音开始播放');
            setIsAnimating(true);
          },
          onEnd: () => {
            console.log('演示模式语音播放结束');
            setIsAnimating(false);
          }
        }).catch(err => {
          console.error('演示模式下语音合成错误:', err);
          setIsAnimating(false);
        });
      }
      
      setIsProcessing(false);
    }, 500); // 添加短暂延迟，确保字幕系统有时间初始化
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2 mt-2">
        <button
          onClick={demoMode ? useDemoResponseForQuery : processUserInput}
          disabled={isProcessing || !userInput.trim()}
          className={`flex-1 py-2 rounded-md font-medium ${
            isProcessing || !userInput.trim()
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? '处理中...' : '获取响应'}
        </button>
        
        <button
          onClick={() => setDemoMode(!demoMode)}
          className={`px-3 py-2 rounded-md font-medium ${
            demoMode ? 'bg-green-600' : 'bg-gray-700'
          }`}
          title={demoMode ? "已启用演示模式" : "启用演示模式"}
        >
          演示
        </button>
      </div>
      
      {demoMode && (
        <div className="mt-2 text-xs text-green-400 bg-green-900/30 p-2 rounded-md">
          已启用演示模式，将使用预设响应，无需API调用
        </div>
      )}
      
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
};

export default AIResponse;