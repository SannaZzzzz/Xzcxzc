import React, { useEffect, useRef, useState, useCallback } from "react";

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
  
  // 超级简化字幕状态 - 直接使用数组显示文本的不同部分
  const [fullText, setFullText] = useState("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const CHUNK_SIZE = 30; // 每段30个字符
  
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

  // 动态创建文本段落数组
  const getTextChunks = useCallback((text: string): string[] => {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE) {
      chunks.push(text.substring(i, Math.min(i + CHUNK_SIZE, text.length)));
    }
    return chunks;
  }, [CHUNK_SIZE]);
  
  // 获取当前应该显示的文本段落
  const getCurrentText = useCallback(() => {
    if (!fullText) return "";
    const chunks = getTextChunks(fullText);
    return chunks[currentChunk] || "";
  }, [fullText, currentChunk, getTextChunks]);

  // 移动到下一个文本块
  const moveToNextChunk = useCallback(() => {
    if (!fullText) return;
    
    const chunks = getTextChunks(fullText);
    
    if (currentChunk < chunks.length - 1) {
      console.log(`移动到下一段: ${currentChunk} -> ${currentChunk + 1}`);
      setCurrentChunk(prev => prev + 1);
      return true;
    } else {
      console.log("已到达最后一段");
      return false;
    }
  }, [fullText, currentChunk, getTextChunks]);

  // 初始化字幕显示和滚动
  useEffect(() => {
    console.log('CharacterAnimation - 动画状态变化:', isAnimating);
    
    if (isAnimating && response) {
      const trimmedResponse = response.trim(); // 保存当前response的trimmed值
      setFullText(trimmedResponse);
      setCurrentChunk(0);
      
      console.log('文本已设置，开始滚动, 文本长度:', trimmedResponse.length);
      
      // 直接使用周期性计时器
      const intervalId = setInterval(() => {
        setCurrentChunk(prev => {
          const chunks = getTextChunks(trimmedResponse); // 使用局部变量而非response
          console.log('当前块:', prev, '总块数:', chunks.length);
          // 如果已是最后一块，则停止
          if (prev >= chunks.length - 1) {
            console.log('已到达最后一块，停止计时器');
            clearInterval(intervalId);
            return prev;
          }
          console.log(`字幕更新: ${prev} -> ${prev + 1}`);
          return prev + 1;
        });
      }, 6550); // 每6.55秒滚动一次
    }
  }, [isAnimating, response, getTextChunks]);

  // 视频加载与播放逻辑
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

  // 处理视频画面
  useEffect(() => {
    // 先检查必要条件
    if (!videoLoaded || !videoRef.current) return;
    if (!canvasRef.current) return; // 单独检查canvas ref
    
    // 安全地获取canvas并添加类型断言
    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;

    // 设置Canvas初始尺寸
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;

    // 如果是移动设备，则调整Canvas大小以适应容器宽度
    if (isMobile && containerRef.current) {
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
        // 检查动画状态
        if (!isAnimating) return;
        
        // 确保canvas引用仍然有效
        if (!canvasRef.current) return;

        // 安全绘制
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
        // 确保canvas引用仍然有效
        if (!canvasRef.current) return;
        
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

    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, videoLoaded, isMobile, videoAspectRatio]);

  // 计算当前进度
  const getProgressPercentage = useCallback(() => {
    if (!fullText) return 0;
    const chunks = getTextChunks(fullText);
    return Math.min(100, ((currentChunk + 1) / chunks.length) * 100);
  }, [fullText, currentChunk, getTextChunks]);

  // 手动前进按钮处理函数
  const handleManualNext = () => {
    moveToNextChunk();
  };

  // 渲染字幕组件
  const renderSubtitle = () => {
    const currentText = getCurrentText();
    if (!currentText) return null;
    
    // 获取文本段落总数
    const totalChunks = getTextChunks(fullText).length;
    
    return (
      <div className="absolute bottom-4 left-2 right-2 flex flex-col items-center z-10">
        <div className="bg-black bg-opacity-85 text-white px-5 py-4 rounded-lg max-w-[95%] text-center border border-tech-blue border-opacity-50 shadow-lg">
          <p className="text-sm md:text-base font-medium leading-relaxed">
            {currentText}
          </p>
          <div className="text-xs text-gray-400 mt-1 opacity-80">
            {`${currentChunk + 1}/${totalChunks}`}
          </div>
        </div>
        
        {/* 进度条 */}
        <div className="w-1/2 h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-tech-blue transition-all duration-300 rounded-full"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>
    );
  };

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
      
      {/* 调试信息 */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="absolute top-1 right-1 bg-black bg-opacity-70 p-1 rounded text-xs text-gray-300 z-20">
          <div>总字数: {fullText.length}</div>
          <div>当前段: {currentChunk + 1}/{getTextChunks(fullText).length}</div>
          <div>动画状态: {isAnimating ? '播放中' : '暂停'}</div>
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
      
      {/* 字幕显示 */}
      {renderSubtitle()}
    </div>
  );
};

export default CharacterAnimation;
