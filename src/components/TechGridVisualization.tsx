import React, { useEffect, useRef } from 'react';

interface TechGridVisualizationProps {
  className?: string;
}

const TechGridVisualization: React.FC<TechGridVisualizationProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 获取实际的显示尺寸
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    
    // 设置canvas的内部尺寸以匹配显示尺寸
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // 创建粒子
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
      private canvasRef: HTMLCanvasElement;
      
      constructor(canvasRef: HTMLCanvasElement) {
        this.canvasRef = canvasRef;
        this.x = Math.random() * this.canvasRef.width;
        this.y = Math.random() * this.canvasRef.height;
        this.size = Math.random() * 3 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = '#38bdf8';
        this.alpha = Math.random() * 0.6 + 0.1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // 如果粒子超出边界，将其反向移动
        if (this.x > this.canvasRef.width) this.x = 0;
        else if (this.x < 0) this.x = this.canvasRef.width;
        
        if (this.y > this.canvasRef.height) this.y = 0;
        else if (this.y < 0) this.y = this.canvasRef.height;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    
    // 绘制连接线
    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.1 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };
    
    // 创建数据流线条
    const dataStreams: DataStream[] = [];
    
    class DataStream {
      startX!: number;
      startY!: number;
      endX!: number;
      endY!: number;
      speed!: number;
      progress!: number;
      width!: number;
      color!: string;
      private canvasRef: HTMLCanvasElement;
      
      constructor(canvasRef: HTMLCanvasElement) {
        this.canvasRef = canvasRef;
        
        // 从边缘开始
        const side = Math.floor(Math.random() * 4);
        
        switch(side) {
          case 0: // 顶部
            this.startX = Math.random() * this.canvasRef.width;
            this.startY = 0;
            break;
          case 1: // 右侧
            this.startX = this.canvasRef.width;
            this.startY = Math.random() * this.canvasRef.height;
            break;
          case 2: // 底部
            this.startX = Math.random() * this.canvasRef.width;
            this.startY = this.canvasRef.height;
            break;
          case 3: // 左侧
            this.startX = 0;
            this.startY = Math.random() * this.canvasRef.height;
            break;
        }
        
        // 随机终点
        this.endX = Math.random() * this.canvasRef.width;
        this.endY = Math.random() * this.canvasRef.height;
        
        this.speed = Math.random() * 0.008 + 0.002;
        this.progress = 0;
        this.width = Math.random() * 1.5 + 0.5;
        
        // 蓝色调
        const blueShade = Math.floor(Math.random() * 40) + 180;
        this.color = `rgba(30, ${blueShade}, 255, 0.4)`;
      }
      
      update() {
        this.progress += this.speed;
        
        if (this.progress >= 1) {
          // 重置数据流
          this.reset();
        }
      }
      
      reset() {
        // 重新设置起点和终点
        const side = Math.floor(Math.random() * 4);
        
        switch(side) {
          case 0: // 顶部
            this.startX = Math.random() * this.canvasRef.width;
            this.startY = 0;
            break;
          case 1: // 右侧
            this.startX = this.canvasRef.width;
            this.startY = Math.random() * this.canvasRef.height;
            break;
          case 2: // 底部
            this.startX = Math.random() * this.canvasRef.width;
            this.startY = this.canvasRef.height;
            break;
          case 3: // 左侧
            this.startX = 0;
            this.startY = Math.random() * this.canvasRef.height;
            break;
        }
        
        this.endX = Math.random() * this.canvasRef.width;
        this.endY = Math.random() * this.canvasRef.height;
        this.progress = 0;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        const currentX = this.startX + (this.endX - this.startX) * this.progress;
        const currentY = this.startY + (this.endY - this.startY) * this.progress;
        
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;
        ctx.stroke();
        
        // 绘制头部光点
        ctx.beginPath();
        ctx.arc(currentX, currentY, this.width * 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }
    
    // 绘制科技风格的网格
    const drawGrid = () => {
      const gridSize = 30;
      ctx.strokeStyle = 'rgba(28, 126, 214, 0.15)';
      ctx.lineWidth = 0.5;
      
      // 水平线
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // 垂直线
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
    };
    
    // 绘制十字形节点
    const drawNodes = () => {
      const nodeCount = 6;
      const nodeSize = 4;
      
      for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1;
        
        // 水平线
        ctx.beginPath();
        ctx.moveTo(x - nodeSize, y);
        ctx.lineTo(x + nodeSize, y);
        ctx.stroke();
        
        // 垂直线
        ctx.beginPath();
        ctx.moveTo(x, y - nodeSize);
        ctx.lineTo(x, y + nodeSize);
        ctx.stroke();
      }
    };
    
    // 初始化
    const init = () => {
      // 创建粒子
      for (let i = 0; i < 30; i++) {
        particles.push(new Particle(canvasRef.current!));
      }
      
      // 创建数据流
      for (let i = 0; i < 5; i++) {
        dataStreams.push(new DataStream(canvasRef.current!));
      }
    };
    
    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制背景
      ctx.fillStyle = 'rgba(10, 21, 37, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 绘制网格
      drawGrid();
      
      // 更新和绘制粒子
      particles.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });
      
      // 绘制连接线
      drawLines();
      
      // 更新和绘制数据流
      dataStreams.forEach(stream => {
        stream.update();
        stream.draw(ctx);
      });
      
      // 绘制节点
      drawNodes();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // 启动动画
    init();
    animate();
    
    // 清理函数
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`tech-visualization ${className || ''}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      }}
    />
  );
};

export default TechGridVisualization;