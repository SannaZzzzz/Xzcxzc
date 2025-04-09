import React, { useEffect, useRef } from 'react';

interface DynamicCityBackgroundProps {
  className?: string;
}

const DynamicCityBackground: React.FC<DynamicCityBackgroundProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 创建背景元素
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // 清除之前的星星和灯光
    const oldElements = container.querySelectorAll('.star, .shooting-star, .city-light, .canton-tower, .tall-building, .foreground-building');
    oldElements.forEach(el => el.remove());
    
    // 创建广州塔（小蛮腰）- 主体位于右侧中间区域
    const cantonTower = document.createElement('div');
    cantonTower.className = 'canton-tower';
    cantonTower.style.left = '75%';
    cantonTower.style.bottom = '25%';
    cantonTower.style.height = '588px'; // 原来840px的70%
    container.appendChild(cantonTower);
    
    // 添加塔身装饰线条
    const towerDecoration = document.createElement('div');
    towerDecoration.className = 'canton-tower-decoration';
    cantonTower.appendChild(towerDecoration);
    
    // 创建广州塔的子元素 - 观光平台
    const observationDeck1 = document.createElement('div');
    observationDeck1.className = 'observation-deck';
    observationDeck1.style.width = '22px';
    observationDeck1.style.height = '8px';
    observationDeck1.style.bottom = `calc(25% + ${378 - 8}px)`; // 540 * 70% = 378
    observationDeck1.style.left = `calc(40% - 11px)`;
    cantonTower.appendChild(observationDeck1);
    
    const observationDeck2 = document.createElement('div');
    observationDeck2.className = 'observation-deck';
    observationDeck2.style.width = '18px';
    observationDeck2.style.height = '6px';
    observationDeck2.style.bottom = `calc(25% + ${315 - 6}px)`; // 450 * 70% = 315
    observationDeck2.style.left = `calc(40% - 9px)`;
    cantonTower.appendChild(observationDeck2);
    
    // 添加塔身灯光效果
    const towerLightsCount = 10;
    for (let i = 0; i < towerLightsCount; i++) {
      const light = document.createElement('div');
      light.className = 'tower-light';
      light.style.left = `${Math.random() * 120 - 10}%`;
      light.style.top = `${20 + (i * 50) + Math.random() * 20}px`;
      light.style.animationDelay = `${Math.random() * 2}s`;
      cantonTower.appendChild(light);
    }
    
    // 在广州塔右侧创建一个特色高楼
    const landmarkBuilding = document.createElement('div');
    landmarkBuilding.className = 'landmark-building';
    landmarkBuilding.style.left = '85%'; // 在广州塔右侧
    landmarkBuilding.style.bottom = '0'; // 从底部开始
    landmarkBuilding.style.width = '32px';
    
    // 计算主体高度（增加80%）
    const mainHeight = '648px'; // 原360px增加80%
    landmarkBuilding.style.height = mainHeight;
    
    container.appendChild(landmarkBuilding);
    
    // 添加高楼的底座
    const buildingBase = document.createElement('div');
    buildingBase.className = 'landmark-building-base';
    landmarkBuilding.appendChild(buildingBase);
    
    // 添加高楼的顶部装饰
    const buildingTop = document.createElement('div');
    buildingTop.className = 'landmark-building-top';
    landmarkBuilding.appendChild(buildingTop);
    
    // 添加高楼的窗户样式
    const buildingWindows = document.createElement('div');
    buildingWindows.className = 'landmark-building-windows';
    landmarkBuilding.appendChild(buildingWindows);
    
    // 为特色高楼添加灯光 - 调整数量适应更高的楼层
    const landmarkLightCount = 50; // 增加灯光数量
    for (let i = 0; i < landmarkLightCount; i++) {
      const light = document.createElement('div');
      light.className = 'building-light';
      light.style.width = '2px';
      light.style.height = '2px';
      // 将灯光分布在整个建筑上
      light.style.left = `${Math.random() * 85 + 5}%`;
      light.style.bottom = `${40 + (i * 12) + Math.random() * 8}px`; // 更大的间距
      light.style.animationDelay = `${Math.random() * 2}s`;
      
      // 随机设置一些灯光颜色为淡蓝色
      if (Math.random() > 0.7) {
        light.style.backgroundColor = 'rgba(100, 180, 255, 0.8)';
        light.style.boxShadow = '0 0 5px rgba(100, 180, 255, 0.7)';
      }
      
      landmarkBuilding.appendChild(light);
    }
    
    // 在底座部分添加少量不同风格的灯光
    const baseLightCount = 8;
    for (let i = 0; i < baseLightCount; i++) {
      const light = document.createElement('div');
      light.className = 'building-light';
      light.style.width = '3px';
      light.style.height = '2px';
      light.style.left = `${Math.random() * 90 + 5}%`;
      light.style.bottom = `${Math.random() * 30 + 5}px`; // 底部区域
      light.style.animationDelay = `${Math.random() * 3}s`;
      light.style.backgroundColor = 'rgba(255, 180, 100, 0.8)'; // 偏黄色的灯光
      light.style.boxShadow = '0 0 6px rgba(255, 180, 100, 0.7)';
      
      landmarkBuilding.appendChild(light);
    }
    
    // 在红框区域创建前景建筑 - 红框区域在中上部分
    const foregroundBuildingCount = 5;
    for (let i = 0; i < foregroundBuildingCount; i++) {
      const foregroundBuilding = document.createElement('div');
      foregroundBuilding.className = 'foreground-building';
      
      // 设置前景建筑在红框区域的分布
      let leftPos, bottomPos, width, height;
      
      // 根据索引分配不同的建筑位置和大小
      switch(i) {
        case 0: // 左侧建筑
          leftPos = '35%';
          bottomPos = '20%';
          width = '25px';
          height = '270px';
          break;
        case 1: // 中间建筑
          leftPos = '50%';
          bottomPos = '15%';
          width = '30px';
          height = '360px';
          break;
        case 2: // 右侧建筑
          leftPos = '65%';
          bottomPos = '18%';
          width = '20px';
          height = '300px';
          break;
        case 3: // 更高的中央建筑
          leftPos = '45%';
          bottomPos = '10%';
          width = '15px';
          height = '420px';
          break;
        case 4: // 小蛮腰左侧的建筑
          leftPos = '70%';
          bottomPos = '15%';
          width = '18px';
          height = '330px';
          break;
        default:
          leftPos = '40%';
          bottomPos = '20%';
          width = '20px';
          height = '240px';
      }
      
      foregroundBuilding.style.left = leftPos;
      foregroundBuilding.style.bottom = bottomPos;
      foregroundBuilding.style.width = width;
      foregroundBuilding.style.height = height;
      
      // 添加建筑灯光
      const lightCount = Math.floor(parseInt(height) / 20);
      for (let j = 0; j < lightCount; j++) {
        const light = document.createElement('div');
        light.className = 'building-light';
        light.style.width = '2px';
        light.style.height = '2px';
        light.style.left = `${Math.random() * 80 + 10}%`;
        light.style.bottom = `${j * 20 + Math.random() * 5}px`;
        light.style.animationDelay = `${Math.random() * 3}s`;
        foregroundBuilding.appendChild(light);
      }
      
      container.appendChild(foregroundBuilding);
    }
    
    // 创建高层建筑 - 中下部分
    const tallBuildingCount = 3;
    for (let i = 0; i < tallBuildingCount; i++) {
      const tallBuilding = document.createElement('div');
      tallBuilding.className = 'tall-building';
      
      // 设置不同建筑的位置和大小
      if (i === 0) {
        tallBuilding.style.left = '30%';
        tallBuilding.style.height = '510px';
        tallBuilding.style.width = '40px';
      } else if (i === 1) {
        tallBuilding.style.left = '60%';
        tallBuilding.style.height = '450px';
        tallBuilding.style.width = '35px';
      } else {
        tallBuilding.style.left = '45%';
        tallBuilding.style.height = '540px';
        tallBuilding.style.width = '30px';
      }
      
      // 添加建筑灯光
      const lightCount = Math.floor(parseInt(tallBuilding.style.height) / 15);
      for (let j = 0; j < lightCount; j++) {
        const light = document.createElement('div');
        light.className = 'building-light';
        light.style.width = '2px';
        light.style.height = '2px';
        light.style.left = `${Math.random() * 80 + 10}%`;
        light.style.bottom = `${j * 15 + Math.random() * 5}px`;
        light.style.animationDelay = `${Math.random() * 3}s`;
        tallBuilding.appendChild(light);
      }
      
      container.appendChild(tallBuilding);
    }
    
    // 创建星星 - 增加数量以覆盖更大区域
    const starCount = 180;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.width = `${Math.random() * 2 + 1}px`;
      star.style.height = star.style.width;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 70}%`;
      star.style.animationDelay = `${Math.random() * 4}s`;
      container.appendChild(star);
    }
    
    // 创建流星 - 增加数量和动画持续时间
    const shootingStarCount = 6;
    for (let i = 0; i < shootingStarCount; i++) {
      const shootingStar = document.createElement('div');
      shootingStar.className = 'shooting-star';
      shootingStar.style.left = `${Math.random() * 70 + 10}%`;
      shootingStar.style.top = `${Math.random() * 40 + 5}%`;
      shootingStar.style.animationDelay = `${Math.random() * 15}s`;
      container.appendChild(shootingStar);
    }
    
    // 创建城市灯光 - 增加数量以覆盖更大区域
    const cityLightCount = 80;
    for (let i = 0; i < cityLightCount; i++) {
      const light = document.createElement('div');
      light.className = 'city-light';
      light.style.width = `${Math.random() * 2 + 1}px`;
      light.style.height = light.style.width;
      light.style.left = `${Math.random() * 100}%`;
      light.style.bottom = `${Math.random() * 25 + 5}%`;
      light.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(light);
    }
    
    // 创建一些更大更亮的灯光，模拟重要建筑
    const brightLightCount = 20;
    for (let i = 0; i < brightLightCount; i++) {
      const brightLight = document.createElement('div');
      brightLight.className = 'city-light bright';
      brightLight.style.width = `${Math.random() * 3 + 2}px`;
      brightLight.style.height = brightLight.style.width;
      brightLight.style.left = `${Math.random() * 100}%`;
      brightLight.style.bottom = `${Math.random() * 15 + 8}%`;
      brightLight.style.animationDelay = `${Math.random() * 2}s`;
      brightLight.style.opacity = '0.9';
      brightLight.style.backgroundColor = '#ffdd99';
      container.appendChild(brightLight);
    }
    
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className={`dynamic-bg-container ${className || ''}`}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <div className="city-skyline" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%' }}></div>
      <div className="stars" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>
    </div>
  );
};

export default DynamicCityBackground;