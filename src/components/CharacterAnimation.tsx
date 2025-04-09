import React, { useEffect, useRef, useState } from "react";

interface CharacterAnimationProps {
  character: string;
  isAnimating: boolean;
  response: string;
}

const CharacterAnimation: React.FC<CharacterAnimationProps> = ({
  character,
  isAnimating,
  response
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9); // 默认视频比例
  
  // 字幕相关状态
  const [currentText, setCurrentText] = useState("");  // 当前显示的文字
  const [sentences, setSentences] = useState<string[]>([]);  // 所有分割的句子
  const sentenceIndexRef = useRef(0);  // 当前显示的句子索引
  const subtitleTimerRef = useRef<NodeJS.Timeout | null>(null);  // 字幕显示定时器
  const progressRef = useRef<number>(0);  // 语音合成进度参考值
  const isAnimatingRef = useRef(false);  // 保存动画状态的引用
  const initialDelayRef = useRef<NodeJS.Timeout | null>(null); // 字幕初始延迟定时器
  
  // 检测移动设备
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初始检测
    handleResize();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 响应变化时分割文本为句子
  useEffect(() => {
    // 添加日志以检查接收到的response
    console.log('CharacterAnimation - 收到的AI回答:', response);
    
    if (response) {
      // 确保清空之前的句子和状态
      setSentences([]);
      setCurrentText("");
      
      // 文本分割逻辑 - 先按标点分句，然后再合并成适当长度的段落
      
      // 句子分割点（各种标点符号）
      const sentenceSplitRegex = /([。？！\.\?!])/g;
      const tempSentences: string[] = [];
      
      // 按标点分句
      if (response.match(sentenceSplitRegex)) {
        // 有标点符号的情况
        const parts = response.split(sentenceSplitRegex);
        for (let i = 0; i < parts.length; i += 2) {
          const text = parts[i];
          const punctuation = i + 1 < parts.length ? parts[i + 1] : '';
          
          if ((text || punctuation)) {
            const combinedText = (text || '') + (punctuation || '');
            if (combinedText.trim()) {
              tempSentences.push(combinedText.trim());
            }
          }
        }
      } else {
        // 没有标点符号的情况
        // 按固定长度分割成句子
        const maxSentenceLength = 20; // 每个句子最多20个字符
        let remaining = response.trim();
        
        while (remaining.length > 0) {
          const chunk = remaining.slice(0, maxSentenceLength);
          tempSentences.push(chunk);
          remaining = remaining.slice(maxSentenceLength);
        }
      }
      
      console.log('分句结果:', tempSentences);
      
      // 将句子合并成段落，每段包含1-2个句子，但不超过30个字符
      const paragraphs: string[] = [];
      let currentParagraph = '';
      
      tempSentences.forEach((sentence, index) => {
        if (!currentParagraph) {
          // 开始新段落
          currentParagraph = sentence;
        } else if (currentParagraph.length + sentence.length <= 30) {
          // 当前段落加上这个句子不超过30个字符，合并
          currentParagraph += sentence;
        } else {
          // 当前段落加上这个句子超过30个字符，保存当前段落并开始新段落
          paragraphs.push(currentParagraph);
          currentParagraph = sentence;
        }
        
        // 每两个句子强制形成一个段落
        if ((index + 1) % 2 === 0 || index === tempSentences.length - 1) {
          if (currentParagraph) {
            paragraphs.push(currentParagraph);
            currentParagraph = '';
          }
        }
      });
      
      // 处理可能剩余的最后一个段落
      if (currentParagraph) {
        paragraphs.push(currentParagraph);
      }
      
      console.log('最终段落结果:', paragraphs);
      setSentences(paragraphs);
    } else {
      setSentences([]);
    }
  }, [response]);

  // 处理动画状态变化
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
    console.log('动画状态变化:', isAnimating, '段落数量:', sentences.length);
    
    // 清除所有现有的计时器
    if (subtitleTimerRef.current) {
      clearTimeout(subtitleTimerRef.current);
      subtitleTimerRef.current = null;
    }
    
    if (initialDelayRef.current) {
      clearTimeout(initialDelayRef.current);
      initialDelayRef.current = null;
    }
    
    if (isAnimating) {
      // 重置字幕状态
      sentenceIndexRef.current = 0;
      
      // 如果有段落要显示
      if (sentences.length > 0) {
        // 设置延迟显示第一个段落
        setTimeout(() => {
          displayNextSegment(0);
        }, 500); // 延迟500ms开始显示
      }
    } else {
      // 停止动画时清除字幕
      setCurrentText("");
    }
    
    return () => {
      if (subtitleTimerRef.current) {
        clearTimeout(subtitleTimerRef.current);
        subtitleTimerRef.current = null;
      }
      if (initialDelayRef.current) {
        clearTimeout(initialDelayRef.current);
        initialDelayRef.current = null;
      }
    };
  }, [isAnimating, sentences]);

  // 显示下一个段落的函数
  const displayNextSegment = (index: number) => {
    // 防止索引越界
    if (index >= sentences.length || !isAnimatingRef.current) {
      return;
    }
    
    // 显示当前段落
    const currentSegment = sentences[index];
    console.log(`显示段落 ${index+1}/${sentences.length}: ${currentSegment}`);
    setCurrentText(currentSegment);
    sentenceIndexRef.current = index;
    
    // 计算当前段落的显示时间
    const displayTime = calculateDisplayTime(currentSegment);
    
    // 设置显示下一个段落的定时器
    subtitleTimerRef.current = setTimeout(() => {
      // 递增索引，显示下一个段落
      displayNextSegment(index + 1);
    }, displayTime);
  };

  // 估算每个段落的显示时间
  const calculateDisplayTime = (text: string) => {
    // 平衡的显示时间计算
    // 基础时间 = 文本长度 * 每字时间
    const charTime = 230; // 每字230ms
    const baseTime = text.length * charTime;
    
    // 每个标点符号增加停顿时间
    let punctuationCount = (text.match(/[。？！；，,\.?!]/g) || []).length;
    let punctuationTime = punctuationCount * 200; // 每标点200ms
    
    // 最短2.2秒，最长6秒
    return Math.max(2200, Math.min(baseTime + punctuationTime, 6000));
  };

  useEffect(() => {
    const video = document.createElement("video");
    videoRef.current = video;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    const basePath = process.env.NODE_ENV === "production" && 
                    typeof window !== "undefined" && 
                    window.location.hostname.includes("github.io") 
                    ? "/interaction" : "";

    let videoSrc = "";
    switch (character) {
      case "anime":
        videoSrc = `${basePath}/animations/anime-character.mp4`;
        break;
      case "custom":
        videoSrc = `${basePath}/animations/custom-character.mp4`;
        break;
      default:
        videoSrc = `${basePath}/animations/default-character.mp4`;
        break;
    }

    console.log("Video source path:", videoSrc);

    // 模拟加载进度
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);

    video.onloadeddata = () => {
      clearInterval(loadingInterval);
      setLoadingProgress(100);
      setVideoLoaded(true);
      console.log("Video loaded successfully");
      // 保存视频的原始宽高比
      if (video.videoWidth && video.videoHeight) {
        setVideoAspectRatio(video.videoWidth / video.videoHeight);
      }
    };

    video.onerror = (e) => {
      clearInterval(loadingInterval);
      console.error("Video load error:", e);
      if (!basePath && typeof window !== "undefined" && window.location.hostname.includes("github.io")) {
        const fallbackPath = "/interaction/animations/default-character.mp4";
        console.log("Trying fallback path:", fallbackPath);
        video.src = fallbackPath;
      }
    };

    video.src = videoSrc;
    video.load();

    return () => {
      clearInterval(loadingInterval);
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [character]);

  useEffect(() => {
    if (!videoLoaded || !videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;

    // 设置Canvas初始尺寸
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;

    // 如果是移动设备，则调整Canvas大小以适应容器宽度
    if (isMobile && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      // 保持视频的原始宽高比
      const aspectRatio = canvas.width / canvas.height;
      
      // 设置宽度为容器宽度，高度根据宽高比计算
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
    } else if (!isMobile && containerRef.current) {
      // 桌面端处理 - 修改：先等比例缩小至动画框的高度，然后把动画框等比例缩小至动画宽度
      const containerHeight = containerRef.current.clientHeight;
      const containerWidth = containerRef.current.clientWidth;
      
      // 1. 首先将动画等比例缩小至动画框的高度
      canvas.style.height = '100%';
      canvas.style.width = 'auto';
      
      // 2. 计算根据高度缩放后的实际宽度
      // 由于canvas.style.width已设为'auto'，这里计算缩放后的宽度
      const scaledWidth = (containerHeight * videoAspectRatio);
      
      // 3. 如果缩放后的宽度超出容器宽度，则需要进一步等比例缩小至宽度
      if (scaledWidth > containerWidth) {
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
      }
    }

    if (isAnimating) {
      video.currentTime = 0;

      const playVideo = async () => {
        try {
          await video.play();
          console.log("Video playing");
        } catch (err) {
          console.error("Video play failed:", err);
        }
      };

      playVideo();

      const renderFrame = () => {
        if (!isAnimating) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 设置科技感效果
        ctx.save();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 为视频添加科技感特效 - 淡蓝色边缘光晕
        ctx.globalCompositeOperation = 'screen';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        animationFrameRef.current = requestAnimationFrame(renderFrame);
      };

      renderFrame();
    } else {
      video.pause();
      if (video.readyState >= 2) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 静态下也添加科技感边框
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.3)';
        ctx.shadowBlur = 5;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, videoLoaded, isMobile, videoAspectRatio]);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {!videoLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-tech-dark bg-opacity-50 backdrop-filter backdrop-blur-sm z-10">
          <div className="w-16 h-16 relative mb-3">
            <div className="absolute inset-0 rounded-full border-2 border-tech-blue opacity-20"></div>
            <div 
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-tech-blue animate-spin"
              style={{ animationDuration: '1s' }}
            ></div>
          </div>
          <div className="text-lg text-tech-blue font-medium">加载角色动画中...</div>
          <div className="w-48 h-2 bg-gray-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-tech-blue transition-all duration-200 rounded-full"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{Math.floor(loadingProgress)}%</div>
        </div>
      )}
      
      {/* 装饰性科技边角 */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tech-blue opacity-70"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tech-blue opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tech-blue opacity-70"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tech-blue opacity-70"></div>
      
      <canvas
        ref={canvasRef}
        className={`object-contain rounded-sm ${isMobile ? 'w-full h-auto' : ''}`}
      />
      
      {/* 字幕区域 - 优化样式以适应更多文本 */}
      {currentText && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center z-10">
          <div className="bg-black bg-opacity-80 text-white px-5 py-3 rounded-lg max-w-[90%] text-center border border-tech-blue border-opacity-40 shadow-lg transform transition-opacity duration-300">
            <p className="text-sm md:text-base font-medium leading-relaxed">{currentText}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterAnimation;