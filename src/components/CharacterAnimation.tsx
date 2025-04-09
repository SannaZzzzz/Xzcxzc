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
  
  // 简化字幕状态 - 直接使用字数切割
  const [fullText, setFullText] = useState("");
  const [currentPosition, setCurrentPosition] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const timerId = useRef<NodeJS.Timeout | null>(null);
  const CHARS_PER_STEP = 50; // 每次显示50个字
  
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

  // 初始化字幕显示
  useEffect(() => {
    console.log('CharacterAnimation组件 - AI响应变化');
    console.log('- 动画状态:', isAnimating);
    console.log('- 接收到响应长度:', response ? response.length : 0);
    
    if (isAnimating && response) {
      // 保存原始回答全文
      const text = response.trim();
      setFullText(text);
      
      // 重置当前位置
      setCurrentPosition(0);
      
      // 启动字幕滚动
      if (text.length > 0) {
        startTextDisplay();
      }
    } else {
      // 停止显示
      stopTextDisplay();
      setFullText("");
      setCurrentPosition(0);
      setDisplayText("");
    }
    
    return () => {
      stopTextDisplay();
    };
  }, [isAnimating, response]);
  
  // 启动字幕滚动 - 极简单可靠的实现
  const startTextDisplay = () => {
    // 清理现有计时器
    stopTextDisplay();
    
    // 立即显示第一段
    updateDisplayText();
    
    // 然后设置计时器，定时更新显示的文本
    timerId.current = setInterval(() => {
      updateDisplayText();
    }, 3000); // 每3秒更新一次
    
    console.log("字幕滚动已启动");
  };
  
  // 停止字幕显示
  const stopTextDisplay = () => {
    if (timerId.current) {
      clearInterval(timerId.current);
      timerId.current = null;
      console.log("字幕滚动已停止");
    }
  };
  
  // 更新当前显示的文本段落
  const updateDisplayText = () => {
    if (fullText.length === 0) return;
    
    // 如果已经显示完全部文本，停止计时器
    if (currentPosition >= fullText.length) {
      stopTextDisplay();
      return;
    }
    
    // 计算当前要显示的文本片段
    const endPosition = Math.min(currentPosition + CHARS_PER_STEP, fullText.length);
    const textSegment = fullText.substring(currentPosition, endPosition);
    
    // 更新显示文本和位置
    setDisplayText(textSegment);
    setCurrentPosition(endPosition);
    
    console.log(`更新字幕: ${currentPosition}-${endPosition}/${fullText.length}`);
    
    // 如果已显示完全部文本，停止计时器
    if (endPosition >= fullText.length) {
      stopTextDisplay();
    }
  };

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

  // 计算进度百分比
  const getProgressPercentage = () => {
    if (fullText.length === 0) return 0;
    return Math.min(100, (currentPosition / fullText.length) * 100);
  };

  // 手动前进按钮
  const handleManualProgress = () => {
    updateDisplayText();
  };

  // 字幕显示组件
  const renderSubtitle = () => {
    if (!displayText) return null;
    
    return (
      <div className="absolute bottom-4 left-2 right-2 flex flex-col items-center z-10">
        <div className="bg-black bg-opacity-85 text-white px-5 py-4 rounded-lg max-w-[95%] text-center border border-tech-blue border-opacity-50 shadow-lg">
          <p className="text-sm md:text-base font-medium leading-relaxed">
            {displayText}
          </p>
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
      
      {/* 调试显示 */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="absolute top-1 right-1 bg-black bg-opacity-70 p-1 rounded text-xs text-gray-300 z-20">
          <div>总字数: {fullText.length}</div>
          <div>已显示: {currentPosition}</div>
          <div>定时器: {timerId.current ? '活动' : '无'}</div>
        </div>
      )}
      
      {/* 手动前进按钮 */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="absolute top-10 right-1 bg-black bg-opacity-70 p-1 rounded text-xs text-white z-30">
          <button 
            className="px-2 py-1 bg-blue-600 rounded text-white text-xs"
            onClick={handleManualProgress}
          >
            手动前进 →
          </button>
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