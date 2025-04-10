import React, { useState, useEffect } from 'react';
import { XFYunWebsocket } from '../utils/xfyunWebsocket';
import { xfyunConfig } from '../config/xfyunConfig';
import MobileTTS from '../utils/mobileTTS';
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
    "要是时间紧想提升技能，首先得找准方向，结合岗位刚需求，明确学啥最有用。再者，善用碎片时段，像等车、午休时看点资料。工作里多主动揽活，把学的及时用上，边干边琢磨。还有，多上专业论坛交流，借鉴他人经验，少走弯路。"
  ];

  useEffect(() => {
    // 当用户输入变化且非空时，处理响应
    if (userInput && !isProcessing) {
      processUserInput();
    }
  }, [userInput]);

  const handleMobileTTS = async (text: string) => {
    try {
      const mobileTTS = MobileTTS.getInstance();
      
      // 适配接口参数，传入配置和回调
      const config = {
        speed: 4,     // 调回默认语速，从5降为4
        pitch: 4,     // 音调，默认4
        volume: 5,    // 音量，默认5
        person: 5003  // 发音人，默认为度逍遥
      };
      
      const callbacks = {
        onStart: () => {
          // 语音开始时才设置动画效果
          console.log('移动端语音合成开始播放');
          setIsAnimating(true);
        },
        onEnd: () => {
          // 语音播放结束时结束动画
          console.log('移动端语音合成播放结束');
          setIsAnimating(false);
        }
      };
      
      // 使用新的参数结构调用speak方法
      await mobileTTS.speak(text, config, callbacks);
    } catch (err: any) {
      console.error('移动端语音合成错误:', err);
      console.error('百度语音合成失败，不再尝试其他服务');
      setIsAnimating(false);
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
      demoText = demoResponses[randomIndex] ;
    }
    
    // 确保演示响应被记录和正确传递
    console.log('演示模式回答:', demoText);
    
    // 设置回复文本 - 先更新文本，然后才开始语音播放
    onResponse(demoText);
    
    setTimeout(() => {
      // 使用相同的语音处理逻辑
      if (isMobile) {
        // 为演示模式也传入正确的参数
        const config = {
          speed: 4,     // 调回默认语速
          pitch: 4,     // 音调
          volume: 5,    // 音量
          person: 5003  // 发音人，默认为度逍遥
        };
        
        const callbacks = {
          onStart: () => {
            console.log('演示模式移动端语音开始播放');
            setIsAnimating(true);
          },
          onEnd: () => {
            console.log('演示模式移动端语音播放结束');
            setIsAnimating(false);
          }
        };
        
        // 直接使用mobileTTS.getInstance()调用，而不是通过handleMobileTTS
        MobileTTS.getInstance().speak(demoText, config, callbacks).catch(err => {
          console.error('演示模式下移动端TTS失败:', err);
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
