import axios from 'axios';

interface TTSConfig {
  speed?: number;    // 语速，范围0-15
  pitch?: number;    // 音调，范围0-15
  volume?: number;   // 音量，范围0-15
  person?: number;   // 发音人，默认为度逍遥(5003)
}

class MobileTTS {
  private static instance: MobileTTS;
  private audio: HTMLAudioElement | null = null;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupAudioListeners(this.audio);
    }
  }

  public static getInstance(): MobileTTS {
    if (!MobileTTS.instance) {
      MobileTTS.instance = new MobileTTS();
    }
    return MobileTTS.instance;
  }

  private setupAudioListeners(audio: HTMLAudioElement, callbacks?: { onStart?: () => void; onEnd?: () => void }) {
    // 添加调试信息
    console.log('MobileTTS: 设置音频事件监听器');
    
    // 设置类实例的回调函数
    if (callbacks) {
      this.onStartCallback = callbacks.onStart || null;
      this.onEndCallback = callbacks.onEnd || null;
    }
    
    audio.onplaying = () => {
      console.log('MobileTTS: 音频开始播放事件触发');
      this.onStartCallback?.();
    };
    
    audio.onended = () => {
      console.log('MobileTTS: 音频播放结束事件触发');
      this.onEndCallback?.();
      URL.revokeObjectURL(audio.src);
    };
    
    // 添加额外的结束检测
    audio.onerror = (e) => {
      console.error('MobileTTS: 音频播放错误', e);
      this.onEndCallback?.(); // 出错也调用结束回调
      URL.revokeObjectURL(audio.src);
    };
  }

  private async generateTTS(text: string, config?: TTSConfig): Promise<Response> {
    const defaultConfig = {
      speed: 4,
      pitch: 5,
      volume: 5,
      person: 5003
    };
    
    // 合并默认配置和用户配置
    const finalConfig = {
      ...defaultConfig,
      ...config
    };
    
    console.log('MobileTTS: 请求语音合成API', { text: text.substring(0, 20) + '...', config: finalConfig });
    
    return fetch('/api/tts/mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        ...finalConfig
      }),
    });
  }

  public async speak(
    text: string, 
    config?: TTSConfig,
    callbacks?: { onStart?: () => void; onEnd?: () => void }
  ): Promise<void> {
    if (!text || text.length === 0) {
      console.warn('MobileTTS: 文本为空，跳过播放');
      callbacks?.onEnd?.();
      return;
    }

    console.log('MobileTTS: 开始合成语音', { text });
    
    try {
      // 避免重叠播放
      this.stop();
      
      const res = await this.generateTTS(text, config);
      console.log('MobileTTS: API响应', { status: res.status });
      
      if (!res.ok) {
        throw new Error(`语音合成API返回错误: ${res.status}`);
      }

      const blob = await res.blob();
      console.log('MobileTTS: 获取到音频数据', { blobSize: blob.size });
      
      if (blob.size === 0) {
        throw new Error('语音合成返回空数据');
      }

      const audioURL = URL.createObjectURL(blob);
      const audio = new Audio(audioURL);
      
      // 设置音频监听器
      this.setupAudioListeners(audio, callbacks);
      
      // 尝试播放
      console.log('MobileTTS: 尝试播放音频');
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('MobileTTS: 播放失败，将在1秒后重试', error);
          URL.revokeObjectURL(audioURL);
          
          // 播放失败时，延迟1秒后重试一次
          setTimeout(() => {
            console.log('MobileTTS: 重试播放');
            const retryAudio = new Audio(audioURL);
            this.setupAudioListeners(retryAudio, callbacks);
            retryAudio.play().catch(e => {
              console.error('MobileTTS: 重试播放也失败', e);
              callbacks?.onEnd?.();
              URL.revokeObjectURL(audioURL);
            });
          }, 1000);
        });
      }
    } catch (error) {
      console.error('MobileTTS: 语音播放过程中出错', error);
      callbacks?.onEnd?.();
    }
  }

  public stop(): void {
    console.log('MobileTTS: 停止播放');
    
    if (this.audio) {
      try {
        // 移除所有事件监听器
        this.audio.onplaying = null;
        this.audio.onended = null;
        this.audio.onerror = null;
        
        // 停止播放
        this.audio.pause();
        
        // 如果有src，获取URL并释放
        if (this.audio.src && this.audio.src.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(this.audio.src);
            console.log('MobileTTS: 释放了音频资源URL');
          } catch (e) {
            console.warn('MobileTTS: 释放音频URL时出错', e);
          }
        }
        
        // 移除src
        this.audio.removeAttribute('src');
        this.audio.load(); // 强制重置音频元素状态
      } catch (e) {
        console.error('MobileTTS: 停止音频播放时出错', e);
      }
      
      this.audio = null;
    }
    
    // 调用结束回调
    if (this.onEndCallback) {
      console.log('MobileTTS: 停止播放时触发结束回调');
      this.onEndCallback();
    }
  }
}

export default MobileTTS; 