// 游戏配置
const GAME_CONFIG = {
    duration: 30, // 游戏时长30秒
    canvasWidth: 0,
    canvasHeight: 0,
    shipSize: 40,
    stardustSize: 30,
    blackHoleSize: 80, // 增大黑洞尺寸
    stardustSpeed: 6, // 加快星尘速度
    blackHoleSpeed: 7, // 加快黑洞速度
    spawnRate: 0.08, // 稍微增加星尘生成率
    blackHoleSpawnRate: 0.08, // 稍微增加黑洞生成率
    touchOffset: 50 // 触摸偏移量，避免手指遮挡
};

// 积分配置
const SCORE_CONFIG = {
    pink: 5,      // 粉色5分
    green: 10,    // 绿色10分
    rainbow: 25,  // 彩虹25分
    blackHole: -30 // 黑洞-30分
};

// 奖励等级配置 - 更新为新的积分区间
const REWARD_LEVELS = [
    { min: 0, max: 299, name: '参与奖', value: '1元兑换码' },
    { min: 300, max: 699, name: '铜质奖励', value: '5元兑换码' },
    { min: 700, max: 999, name: '银质奖励', value: '10元兑换码' },
    { min: 1000, max: 1999, name: '金质奖励', value: '50元兑换码' },
    { min: 2000, max: Infinity, name: '星钻奖励', value: '100元兑换码' }
];

// JSONBin配置
const JSONBIN_CONFIG = {
    binId: '68ea90cdae596e708f0eb402', // 替换为您的JSONBin ID
    apiKey: '$2a$10$jm/VPb/omDLo8u4selSVL.VShILiV2Y2q5SZSDfB9yn3F5b6sgjT6', // 替换为您的API密钥
    apiUrl: 'https://api.jsonbin.io/v3/b/'
};

// 游戏状态
let gameState = {
    isPlaying: false,
    score: 0,
    timeLeft: GAME_CONFIG.duration,
    shipX: 0,
    shipY: 0,
    stardusts: [],
    blackHoles: [],
    particles: [],
    animationId: null,
    timerId: null
};

// 获取DOM元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const finalScoreDisplay = document.getElementById('finalScore');
const rewardSection = document.getElementById('rewardSection');
const rewardLevel = document.getElementById('rewardLevel');
const rewardCode = document.getElementById('rewardCode');
const codeText = document.getElementById('codeText');
const noStock = document.getElementById('noStock');
const startBtn = document.getElementById('startBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const copyBtn = document.getElementById('copyBtn');

// 初始化画布
function initCanvas() {
    GAME_CONFIG.canvasWidth = window.innerWidth;
    GAME_CONFIG.canvasHeight = window.innerHeight;
    canvas.width = GAME_CONFIG.canvasWidth;
    canvas.height = GAME_CONFIG.canvasHeight;
}

// 星尘类
class Stardust {
    constructor() {
        this.x = Math.random() * GAME_CONFIG.canvasWidth;
        this.y = -GAME_CONFIG.stardustSize;
        this.speed = GAME_CONFIG.stardustSpeed + Math.random() * 2;
        this.rotation = 0;
        this.rotationSpeed = Math.random() * 0.1 - 0.05;
        
        // 随机类型
        const rand = Math.random();
        if (rand < 0.1) {
            this.type = 'rainbow';
            this.color = null; // 彩虹色将在绘制时处理
        } else if (rand < 0.4) {
            this.type = 'green';
            this.color = '#00ff00';
        } else {
            this.type = 'pink';
            this.color = '#ff69b4';
        }
    }
    
    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.type === 'rainbow') {
            // 绘制彩虹星尘
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, GAME_CONFIG.stardustSize);
            const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
            colors.forEach((color, i) => {
                gradient.addColorStop(i / colors.length, color);
            });
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
        }
        
        // 绘制星形
        drawStar(0, 0, GAME_CONFIG.stardustSize / 2, GAME_CONFIG.stardustSize / 4, 5);
        
        ctx.restore();
    }
    
    isOffScreen() {
        return this.y > GAME_CONFIG.canvasHeight + GAME_CONFIG.stardustSize;
    }
    
    checkCollision(x, y) {
        const distance = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
        return distance < GAME_CONFIG.stardustSize + GAME_CONFIG.shipSize / 2;
    }
}

// 黑洞类
class BlackHole {
    constructor() {
        this.x = Math.random() * GAME_CONFIG.canvasWidth;
        this.y = -GAME_CONFIG.blackHoleSize;
        this.speed = GAME_CONFIG.blackHoleSpeed;
        this.rotation = 0;
        this.rotationSpeed = 0.05;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.y += this.speed;
        this.rotation += this.rotationSpeed;
        this.pulsePhase += 0.05;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制黑洞
        const pulseSize = GAME_CONFIG.blackHoleSize * (1 + Math.sin(this.pulsePhase) * 0.1);
        
        // 外圈光晕
        const gradient = ctx.createRadialGradient(0, 0, pulseSize * 0.3, 0, 0, pulseSize);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.8)');
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 中心黑洞
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, pulseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加旋转的吸积盘效果
        ctx.strokeStyle = 'rgba(128, 0, 255, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.ellipse(0, 0, pulseSize * 0.6, pulseSize * 0.2, this.rotation + i * Math.PI / 3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    isOffScreen() {
        return this.y > GAME_CONFIG.canvasHeight + GAME_CONFIG.blackHoleSize;
    }
    
    checkCollision(x, y) {
        const distance = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
        return distance < GAME_CONFIG.blackHoleSize * 0.7 + GAME_CONFIG.shipSize / 2;
    }
}

// 粒子类
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1;
        this.color = color;
        this.size = Math.random() * 3 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    isDead() {
        return this.life <= 0;
    }
}

// 绘制星形
function drawStar(cx, cy, outerRadius, innerRadius, points) {
    let angle = -Math.PI / 2;
    const angleStep = Math.PI / points;
    
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        angle += angleStep;
    }
    ctx.closePath();
    ctx.fill();
}

// 绘制飞船
function drawShip(x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    // 飞船主体
    const gradient = ctx.createLinearGradient(-GAME_CONFIG.shipSize/2, 0, GAME_CONFIG.shipSize/2, 0);
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(0.5, '#ffffff');
    gradient.addColorStop(1, '#00ffff');
    
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    
    // 绘制三角形飞船
    ctx.beginPath();
    ctx.moveTo(0, -GAME_CONFIG.shipSize/2);
    ctx.lineTo(-GAME_CONFIG.shipSize/2, GAME_CONFIG.shipSize/2);
    ctx.lineTo(GAME_CONFIG.shipSize/2, GAME_CONFIG.shipSize/2);
    ctx.closePath();
    ctx.fill();
    
    // 引擎光效
    const engineGlow = ctx.createRadialGradient(0, GAME_CONFIG.shipSize/2, 0, 0, GAME_CONFIG.shipSize/2, GAME_CONFIG.shipSize/3);
    engineGlow.addColorStop(0, 'rgba(255, 100, 0, 0.8)');
    engineGlow.addColorStop(1, 'rgba(255, 200, 0, 0)');
    
    ctx.fillStyle = engineGlow;
    ctx.beginPath();
    ctx.arc(-GAME_CONFIG.shipSize/4, GAME_CONFIG.shipSize/2, GAME_CONFIG.shipSize/4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(GAME_CONFIG.shipSize/4, GAME_CONFIG.shipSize/2, GAME_CONFIG.shipSize/4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// 创建粒子爆炸效果
function createParticleExplosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

// 播放收集音效
function playCollectSound(type) {
    if (window.GameSounds) {
        try {
            window.GameSounds.playCollectSound(type);
        } catch (e) {
            console.log('Sound play failed:', e);
        }
    }
}

// 播放黑洞音效
function playBlackHoleSound() {
    if (window.GameSounds) {
        try {
            window.GameSounds.playBlackHoleSound();
        } catch (e) {
            console.log('Sound play failed:', e);
        }
    }
}

// 游戏主循环
function gameLoop() {
    if (!gameState.isPlaying) return;
    
    // 清空画布
    ctx.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
    
    // 生成新的星尘
    if (Math.random() < GAME_CONFIG.spawnRate) {
        gameState.stardusts.push(new Stardust());
    }
    
    // 生成黑洞
    if (Math.random() < GAME_CONFIG.blackHoleSpawnRate) {
        gameState.blackHoles.push(new BlackHole());
    }
    
    // 更新和绘制星尘
    gameState.stardusts = gameState.stardusts.filter(stardust => {
        stardust.update();
        
        // 检查碰撞
        if (stardust.checkCollision(gameState.shipX, gameState.shipY)) {
            // 计算得分
            let points = 0;
            let particleColor = stardust.color;
            
            switch(stardust.type) {
                case 'pink':
                    points = SCORE_CONFIG.pink;
                    break;
                case 'green':
                    points = SCORE_CONFIG.green;
                    break;
                case 'rainbow':
                    points = SCORE_CONFIG.rainbow;
                    particleColor = '#ffffff';
                    break;
            }
            
            gameState.score += points;
            updateScore();
            
            // 播放对应类型的音效
            playCollectSound(stardust.type);
            
            // 创建粒子效果
            createParticleExplosion(stardust.x, stardust.y, particleColor, 15);
            
            return false; // 移除已收集的星尘
        }
        
        if (stardust.isOffScreen()) {
            return false;
        }
        
        stardust.draw();
        return true;
    });
    
    // 更新和绘制黑洞
    gameState.blackHoles = gameState.blackHoles.filter(blackHole => {
        blackHole.update();
        
        // 检查碰撞
        if (blackHole.checkCollision(gameState.shipX, gameState.shipY)) {
            gameState.score += SCORE_CONFIG.blackHole;
            if (gameState.score < 0) gameState.score = 0;
            updateScore();
            
            // 播放黑洞音效
            playBlackHoleSound();
            
            // 创建粒子效果
            createParticleExplosion(blackHole.x, blackHole.y, '#4a0080', 30);
            
            return false;
        }
        
        if (blackHole.isOffScreen()) {
            return false;
        }
        
        blackHole.draw();
        return true;
    });
    
    // 更新和绘制粒子
    gameState.particles = gameState.particles.filter(particle => {
        particle.update();
        if (particle.isDead()) {
            return false;
        }
        particle.draw();
        return true;
    });
    
    // 绘制飞船
    drawShip(gameState.shipX, gameState.shipY);
    
    // 继续动画循环
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// 更新分数显示
function updateScore() {
    scoreDisplay.textContent = gameState.score;
    // 添加动画效果
    scoreDisplay.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreDisplay.style.transform = 'scale(1)';
    }, 200);
}

// 更新计时器
function updateTimer() {
    gameState.timeLeft--;
    timerDisplay.textContent = gameState.timeLeft;
    
    if (gameState.timeLeft <= 10) {
        timerDisplay.style.color = '#ff6b6b';
        
        // 播放警告音
        if (gameState.timeLeft <= 5 && window.GameSounds) {
            window.GameSounds.playWarningSound();
        }
    }
    
    if (gameState.timeLeft <= 0) {
        endGame();
    }
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    gameState = {
        isPlaying: true,
        score: 0,
        timeLeft: GAME_CONFIG.duration,
        shipX: GAME_CONFIG.canvasWidth / 2,
        shipY: GAME_CONFIG.canvasHeight - 100,
        stardusts: [],
        blackHoles: [],
        particles: [],
        animationId: null,
        timerId: null
    };
    
    // 更新UI
    updateScore();
    timerDisplay.textContent = gameState.timeLeft;
    timerDisplay.style.color = 'white';
    
    // 隐藏开始界面
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    
    // 开始计时器
    gameState.timerId = setInterval(updateTimer, 1000);
    
    // 开始游戏循环
    gameLoop();
}

// 结束游戏
async function endGame() {
    gameState.isPlaying = false;
    
    // 停止动画和计时器
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
    }
    
    // 播放游戏结束音效
    if (window.GameSounds) {
        window.GameSounds.playGameOverSound();
        
        // 如果得分很高，播放成功音效
        if (gameState.score >= 1000) {
            setTimeout(() => {
                window.GameSounds.playSuccessSound();
            }, 500);
        }
    }
    
    // 显示最终得分
    finalScoreDisplay.textContent = gameState.score;
    
    // 确定奖励等级
    const level = REWARD_LEVELS.find(l => gameState.score >= l.min && gameState.score <= l.max);
    
    if (level) {
        rewardLevel.textContent = `🏆 ${level.name}`;
        
        // 获取兑换码
        const code = await getRedeemCode(level);
        
        if (code) {
            codeText.value = code;
            rewardCode.style.display = 'block';
            noStock.style.display = 'none';
        } else {
            rewardCode.style.display = 'none';
            noStock.style.display = 'block';
        }
    }
    
    // 显示结束界面
    endScreen.style.display = 'flex';
    
    // 创建庆祝粒子效果
    if (gameState.score >= 1000) {
        createCelebration();
    }
}

// 获取兑换码
async function getRedeemCode(level) {
    try {
        // 从JSONBin获取兑换码列表
        const response = await fetch(`${JSONBIN_CONFIG.apiUrl}${JSONBIN_CONFIG.binId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch codes');
            return null;
        }
        
        const data = await response.json();
        const codes = data.record.codes || [];
        
        // 查找对应等级的未使用兑换码
        const availableCode = codes.find(code => 
            code.level === level.name && !code.used
        );
        
        if (!availableCode) {
            return null;
        }
        
        // 标记为已使用
        availableCode.used = true;
        availableCode.usedAt = new Date().toISOString();
        
        // 更新JSONBin
        await fetch(`${JSONBIN_CONFIG.apiUrl}${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.apiKey
            },
            body: JSON.stringify({ codes })
        });
        
        return availableCode.code;
    } catch (error) {
        console.error('Error getting redeem code:', error);
        return null;
    }
}

// 创建庆祝效果
function createCelebration() {
    const particlesContainer = document.getElementById('particles');
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
            particle.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
            particle.style.setProperty('--ty', (Math.random() - 0.5) * 200 + 'px');
            
            particlesContainer.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }, i * 20);
    }
}

// 复制兑换码
function copyCode() {
    codeText.select();
    document.execCommand('copy');
    
    copyBtn.textContent = '已复制！';
    copyBtn.style.background = 'linear-gradient(45deg, #00ff00, #00cc00)';
    
    setTimeout(() => {
        copyBtn.textContent = '复制';
    }, 2000);
}

// 鼠标移动事件
function handleMouseMove(e) {
    if (!gameState.isPlaying) return;
    
    const rect = canvas.getBoundingClientRect();
    gameState.shipX = e.clientX - rect.left;
    gameState.shipY = e.clientY - rect.top;
}

// 触摸移动事件
function handleTouchMove(e) {
    if (!gameState.isPlaying) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    gameState.shipX = touch.clientX - rect.left;
    gameState.shipY = touch.clientY - rect.top - GAME_CONFIG.touchOffset;
}

// 窗口大小改变
function handleResize() {
    initCanvas();
}

// 初始化事件监听
function initEventListeners() {
    // 按钮事件 - 添加音效
    startBtn.addEventListener('click', () => {
        if (window.GameSounds) {
            window.GameSounds.playClickSound();
        }
        startGame();
    });
    
    playAgainBtn.addEventListener('click', () => {
        if (window.GameSounds) {
            window.GameSounds.playClickSound();
        }
        startGame();
    });
    
    copyBtn.addEventListener('click', () => {
        if (window.GameSounds) {
            window.GameSounds.playClickSound();
        }
        copyCode();
    });
    
    // 鼠标和触摸事件
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    
    // 窗口大小改变
    window.addEventListener('resize', handleResize);
    
    // 禁用右键菜单
    document.addEventListener('contextmenu', e => e.preventDefault());
}

// 初始化游戏
function init() {
    initCanvas();
    initEventListeners();
    
    // 初始化音效系统
    if (!window.GameSounds) {
        const script = document.createElement('script');
        script.src = 'js/sounds.js';
        document.head.appendChild(script);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);
