// 游戏配置
const GAME_CONFIG = {
    duration: 30, // 游戏时长30秒
    canvasWidth: 0,
    canvasHeight: 0,
    shipSize: 40,
    stardustSize: 30,
    blackHoleSize: 55,
    stardustSpeed: 7,
    blackHoleSpeed: 10,
    spawnRate: 0.15,
    blackHoleSpawnRate: 0.18,
    touchOffset: 50,
    rewardPlayLimit: 3 // 可获得奖励的游戏次数
};

// 积分配置
const SCORE_CONFIG = {
    pink: 5,
    green: 10,
    rainbow: 25,
    blackHole: -30
};

// 奖励等级配置
const REWARD_LEVELS = [
    { min: 0, max: 299, name: '参与奖', value: '1元兑换码' },
    { min: 300, max: 699, name: '铜质奖励', value: '5元兑换码' },
    { min: 700, max: 999, name: '银质奖励', value: '10元兑换码' },
    { min: 1000, max: 1999, name: '金质奖励', value: '50元兑换码' },
    { min: 2000, max: Infinity, name: '星钻奖励', value: '100元兑换码' }
];

// JSONBin配置（兑换码）
const JSONBIN_CONFIG = {
    binId: '68ea90cdae596e708f0eb402',
    apiKey: '$2a$10$jm/VPb/omDLo8u4selSVL.VShILiV2Y2q5SZSDfB9yn3F5b6sgjT6',
    apiUrl: 'https://api.jsonbin.io/v3/b/'
};

// IP获取服务配置
const IP_SERVICE = 'https://api.ipify.org?format=json';

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
    timerId: null,
    playerIP: null,
    todayRewardPlays: 0,
    totalPlaysToday: 0,
    canGetReward: true,
    highScore: 0
};

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', function() {
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
    const viewLeaderboardBtn = document.getElementById('viewLeaderboardBtn');
    
    // 昵称相关元素
    const nicknameSection = document.getElementById('nicknameSection');
    const gameContent = document.getElementById('gameContent');
    const nicknameInput = document.getElementById('nicknameInput');
    const confirmNickname = document.getElementById('confirmNickname');
    const nicknameError = document.getElementById('nicknameError');
    const playerName = document.getElementById('playerName');
    const changeNickname = document.getElementById('changeNickname');
    
    // 排行榜相关元素
    const showLeaderboard = document.getElementById('showLeaderboard');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const leaderboardList = document.getElementById('leaderboardList');
    const closeLeaderboard = document.getElementById('closeLeaderboard');

    // 初始化昵称
    function initNickname() {
        const savedNickname = window.leaderboardManager.getNickname();
        if (savedNickname) {
            showGameContent(savedNickname);
        } else {
            nicknameSection.style.display = 'block';
            gameContent.style.display = 'none';
        }
    }

    // 显示游戏内容
    function showGameContent(nickname) {
        nicknameSection.style.display = 'none';
        gameContent.style.display = 'block';
        if (playerName) {
            playerName.textContent = nickname;
        }
    }

    // 确认昵称
    if (confirmNickname) {
        confirmNickname.addEventListener('click', () => {
            const nickname = nicknameInput.value;
            const result = window.leaderboardManager.setNickname(nickname);
            
            if (result.success) {
                nicknameError.textContent = '';
                showGameContent(window.leaderboardManager.getNickname());
            } else {
                nicknameError.textContent = result.error;
            }
        });
    }

    // 输入框回车确认
    if (nicknameInput) {
        nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmNickname.click();
            }
        });
    }

    // 更改昵称
    if (changeNickname) {
        changeNickname.addEventListener('click', () => {
            window.leaderboardManager.clearNickname();
            nicknameSection.style.display = 'block';
            gameContent.style.display = 'none';
            nicknameInput.value = '';
            nicknameError.textContent = '';
        });
    }

    // 显示排行榜
    if (showLeaderboard) {
        showLeaderboard.addEventListener('click', async () => {
            await displayLeaderboard();
        });
    }

    // 关闭排行榜
    if (closeLeaderboard) {
        closeLeaderboard.addEventListener('click', () => {
            leaderboardScreen.style.display = 'none';
            
            // 判断应该显示哪个界面
            if (gameState.isPlaying) {
                // 游戏进行中不应该发生，但以防万一
            } else if (finalScoreDisplay && finalScoreDisplay.textContent !== '0') {
                // 如果有最终分数，说明是从结束界面进入的
                if (endScreen) {
                    endScreen.style.display = 'flex';
                }
            } else {
                // 否则返回开始界面
                if (startScreen) {
                    startScreen.style.display = 'flex';
                }
            }
        });
    }

    // 显示排行榜函数
    async function displayLeaderboard() {
        leaderboardScreen.style.display = 'flex';
        leaderboardList.innerHTML = '<div class="leaderboard-empty">加载中...</div>';
        
        await window.leaderboardManager.loadLeaderboard();
        const formattedLeaderboard = window.leaderboardManager.formatLeaderboard();
        
        if (formattedLeaderboard.length === 0) {
            leaderboardList.innerHTML = '<div class="leaderboard-empty">暂无排行数据</div>';
            return;
        }
        
        leaderboardList.innerHTML = formattedLeaderboard.map(entry => {
            let classes = 'leaderboard-item';
            let rankClass = '';
            
            if (entry.rank === 1) {
                classes += ' top1';
                rankClass = 'top1';
            } else if (entry.rank === 2) {
                classes += ' top2';
                rankClass = 'top2';
            } else if (entry.rank === 3) {
                classes += ' top3';
                rankClass = 'top3';
            }
            
            if (entry.isCurrentPlayer) {
                classes += ' current-player';
            }
            
            return `
                <div class="${classes}">
                    <div class="rank-number ${rankClass}">${entry.rank}</div>
                    <div class="player-nickname">${entry.nickname}</div>
                    <div class="player-score">${entry.score}</div>
                </div>
            `;
        }).join('');
    }

    // 显示排名通知
    function showRankNotification(rank) {
        const notification = document.createElement('div');
        notification.className = 'rank-notification';
        notification.innerHTML = `🎉 恭喜！您进入了第 ${rank} 名！`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 获取玩家IP
    async function getPlayerIP() {
        try {
            const response = await fetch(IP_SERVICE);
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to get IP:', error);
            let localId = localStorage.getItem('playerLocalId');
            if (!localId) {
                localId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('playerLocalId', localId);
            }
            return localId;
        }
    }

    // 获取今日奖励游戏次数
    function getTodayRewardPlays(ip) {
        const today = new Date().toDateString();
        const storageKey = `rewardPlays_${ip}_${today}`;
        const plays = localStorage.getItem(storageKey);
        return plays ? parseInt(plays) : 0;
    }

    // 获取今日总游戏次数
    function getTotalPlaysToday(ip) {
        const today = new Date().toDateString();
        const storageKey = `totalPlays_${ip}_${today}`;
        const plays = localStorage.getItem(storageKey);
        return plays ? parseInt(plays) : 0;
    }

    // 获取历史最高分
    function getHighScore() {
        const score = localStorage.getItem('highScore');
        return score ? parseInt(score) : 0;
    }

    // 保存最高分
    function saveHighScore(score) {
        const currentHigh = getHighScore();
        if (score > currentHigh) {
            localStorage.setItem('highScore', score);
            return true;
        }
        return false;
    }

    // 增加奖励游戏次数
    function incrementRewardPlays(ip) {
        const today = new Date().toDateString();
        const storageKey = `rewardPlays_${ip}_${today}`;
        const currentPlays = getTodayRewardPlays(ip);
        localStorage.setItem(storageKey, currentPlays + 1);
        return currentPlays + 1;
    }

    // 增加总游戏次数
    function incrementTotalPlays(ip) {
        const today = new Date().toDateString();
        const storageKey = `totalPlays_${ip}_${today}`;
        const currentPlays = getTotalPlaysToday(ip);
        localStorage.setItem(storageKey, currentPlays + 1);
        return currentPlays + 1;
    }

    // 清理过期的游戏记录
    function cleanOldPlayRecords() {
        const today = new Date().toDateString();
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('rewardPlays_') || key.startsWith('totalPlays_')) && !key.includes(today)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // 检查游戏状态
    async function checkGameStatus() {
        if (!gameState.playerIP) {
            gameState.playerIP = await getPlayerIP();
        }
        
        cleanOldPlayRecords();
        
        gameState.todayRewardPlays = getTodayRewardPlays(gameState.playerIP);
        gameState.totalPlaysToday = getTotalPlaysToday(gameState.playerIP);
        gameState.canGetReward = gameState.todayRewardPlays < GAME_CONFIG.rewardPlayLimit;
        gameState.highScore = getHighScore();
        
        updatePlayStatusUI();
    }

    // 更新游戏状态UI
    function updatePlayStatusUI() {
        const remainingRewardPlays = GAME_CONFIG.rewardPlayLimit - gameState.todayRewardPlays;
        
        // 显示最高分
        let highScoreDisplay = document.getElementById('highScoreDisplay');
        if (!highScoreDisplay) {
            highScoreDisplay = document.createElement('div');
            highScoreDisplay.id = 'highScoreDisplay';
            highScoreDisplay.className = 'high-score-display';
            const gameContentDiv = document.getElementById('gameContent');
            if (gameContentDiv && document.querySelector('.rules')) {
                gameContentDiv.insertBefore(highScoreDisplay, document.querySelector('.rules'));
            }
        }
        if (highScoreDisplay) {
            highScoreDisplay.innerHTML = `
                <div class="high-score-label">🏆 最高纪录</div>
                <div class="high-score-value">${gameState.highScore}</div>
            `;
        }
        
        // 显示游戏次数信息
        let limitInfo = document.getElementById('playLimitInfo');
        if (!limitInfo) {
            limitInfo = document.createElement('div');
            limitInfo.id = 'playLimitInfo';
            limitInfo.className = 'play-limit-info';
            const gameContentDiv = document.getElementById('gameContent');
            if (gameContentDiv && startBtn) {
                gameContentDiv.insertBefore(limitInfo, startBtn);
            }
        }
        
        if (limitInfo) {
            if (remainingRewardPlays > 0) {
                limitInfo.innerHTML = `
                    <div class="limit-display">
                        🎁 可获得奖励次数：<span class="remaining-count">${remainingRewardPlays}</span> / ${GAME_CONFIG.rewardPlayLimit}
                        <div class="sub-text">用完后可继续游玩，但不再发放兑换码</div>
                    </div>
                `;
            } else {
                limitInfo.innerHTML = `
                    <div class="limit-display no-reward">
                        练习模式
                        <div class="sub-text">今日奖励次数已用完，继续游玩不会获得兑换码</div>
                        <div class="play-count">今日已玩 ${gameState.totalPlaysToday} 次</div>
                    </div>
                `;
            }
        }
        
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
        }
    }

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
            
            const rand = Math.random();
            if (rand < 0.1) {
                this.type = 'rainbow';
                this.color = null;
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
            this.speed = GAME_CONFIG.blackHoleSpeed + Math.random() * 2;
            this.rotation = 0;
            this.rotationSpeed = 0.05;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.size = GAME_CONFIG.blackHoleSize + Math.random() * 20 - 10;
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
            
            const pulseSize = this.size * (1 + Math.sin(this.pulsePhase) * 0.1);
            
            const gradient = ctx.createRadialGradient(0, 0, pulseSize * 0.3, 0, 0, pulseSize);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.8)');
            gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, 0, pulseSize * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
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
            return this.y > GAME_CONFIG.canvasHeight + this.size;
        }
        
        checkCollision(x, y) {
            const distance = Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
            return distance < this.size * 0.7 + GAME_CONFIG.shipSize / 2;
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
        
        const gradient = ctx.createLinearGradient(-GAME_CONFIG.shipSize/2, 0, GAME_CONFIG.shipSize/2, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(1, '#00ffff');
        
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        
        ctx.beginPath();
        ctx.moveTo(0, -GAME_CONFIG.shipSize/2);
        ctx.lineTo(-GAME_CONFIG.shipSize/2, GAME_CONFIG.shipSize/2);
        ctx.lineTo(GAME_CONFIG.shipSize/2, GAME_CONFIG.shipSize/2);
        ctx.closePath();
        ctx.fill();
        
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
        
        ctx.clearRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
        
        if (Math.random() < GAME_CONFIG.spawnRate) {
            gameState.stardusts.push(new Stardust());
        }
        
        if (Math.random() < GAME_CONFIG.blackHoleSpawnRate) {
            gameState.blackHoles.push(new BlackHole());
        }
        
        if (gameState.timeLeft < 20 && Math.random() < 0.005) {
            gameState.blackHoles.push(new BlackHole());
        }
        
        gameState.stardusts = gameState.stardusts.filter(stardust => {
            stardust.update();
            
            if (stardust.checkCollision(gameState.shipX, gameState.shipY)) {
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
                playCollectSound(stardust.type);
                createParticleExplosion(stardust.x, stardust.y, particleColor, 15);
                
                return false;
            }
            
            if (stardust.isOffScreen()) {
                return false;
            }
            
            stardust.draw();
            return true;
        });
        
        gameState.blackHoles = gameState.blackHoles.filter(blackHole => {
            blackHole.update();
            
            if (blackHole.checkCollision(gameState.shipX, gameState.shipY)) {
                gameState.score += SCORE_CONFIG.blackHole;
                if (gameState.score < 0) gameState.score = 0;
                updateScore();
                playBlackHoleSound();
                createParticleExplosion(blackHole.x, blackHole.y, '#4a0080', 30);
                
                return false;
            }
            
            if (blackHole.isOffScreen()) {
                return false;
            }
            
            blackHole.draw();
            return true;
        });
        
        gameState.particles = gameState.particles.filter(particle => {
            particle.update();
            if (particle.isDead()) {
                return false;
            }
            particle.draw();
            return true;
        });
        
        drawShip(gameState.shipX, gameState.shipY);
        
        gameState.animationId = requestAnimationFrame(gameLoop);
    }

    // 更新分数显示
    function updateScore() {
        if (scoreDisplay) {
            scoreDisplay.textContent = gameState.score;
            scoreDisplay.style.transform = 'scale(1.2)';
            setTimeout(() => {
                scoreDisplay.style.transform = 'scale(1)';
            }, 200);
        }
    }

    // 更新计时器
    function updateTimer() {
        gameState.timeLeft--;
        if (timerDisplay) {
            timerDisplay.textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 10) {
                timerDisplay.style.color = '#ff6b6b';
                
                if (gameState.timeLeft <= 5 && window.GameSounds) {
                    window.GameSounds.playWarningSound();
                }
            }
        }
        
        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }

    // 开始游戏
    async function startGame() {
        // 检查是否有昵称
        if (!window.leaderboardManager.getNickname()) {
            alert('请先设置昵称！');
            return;
        }
        
        await checkGameStatus();
        
        gameState.totalPlaysToday = incrementTotalPlays(gameState.playerIP);
        
        gameState = {
            ...gameState,
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
        
        updateScore();
        if (timerDisplay) {
            timerDisplay.textContent = gameState.timeLeft;
            timerDisplay.style.color = 'white';
        }
        
        if (startScreen) startScreen.style.display = 'none';
        if (endScreen) endScreen.style.display = 'none';
        
        gameState.timerId = setInterval(updateTimer, 1000);
        gameLoop();
    }

    // 接受奖励
    window.acceptReward = async function(levelName) {
        gameState.todayRewardPlays = incrementRewardPlays(gameState.playerIP);
        
        const level = REWARD_LEVELS.find(l => l.name === levelName);
        const code = await getRedeemCode(level);
        
        const rewardChoice = document.getElementById('rewardChoice');
        if (rewardChoice) {
            rewardChoice.style.display = 'none';
        }
        
        if (code) {
            if (codeText) codeText.value = code;
            if (rewardCode) rewardCode.style.display = 'block';
            if (noStock) noStock.style.display = 'none';
        } else {
            if (rewardCode) rewardCode.style.display = 'none';
            if (noStock) noStock.style.display = 'block';
        }
        
        updatePlayAgainButton();
    };

    // 跳过奖励
    window.skipReward = function() {
        gameState.todayRewardPlays = incrementRewardPlays(gameState.playerIP);
        
        const rewardChoice = document.getElementById('rewardChoice');
        if (rewardChoice) {
            rewardChoice.innerHTML = `
                <div class="skipped-reward">
                    <p>您已跳过本次奖励</p>
                </div>
            `;
        }
        
        updatePlayAgainButton();
    };

    // 更新再玩一次按钮
    function updatePlayAgainButton() {
        gameState.canGetReward = gameState.todayRewardPlays < GAME_CONFIG.rewardPlayLimit;
        
        let playAgainText = document.getElementById('playAgainText');
        if (!playAgainText && playAgainBtn) {
            playAgainText = document.createElement('div');
            playAgainText.id = 'playAgainText';
            playAgainText.className = 'play-again-text';
            playAgainBtn.parentNode.insertBefore(playAgainText, playAgainBtn.parentNode.querySelector('.end-buttons'));
        }
        
        if (playAgainText) {
            if (gameState.canGetReward) {
                const remaining = GAME_CONFIG.rewardPlayLimit - gameState.todayRewardPlays;
                playAgainText.innerHTML = `剩余奖励次数：${remaining}`;
            } else {
                playAgainText.innerHTML = `练习模式（无奖励）`;
            }
        }
        
        if (playAgainBtn) {
            playAgainBtn.disabled = false;
            playAgainBtn.style.opacity = '1';
        }
    }

    // 结束游戏
    async function endGame() {
        gameState.isPlaying = false;
        
        if (gameState.animationId) {
            cancelAnimationFrame(gameState.animationId);
        }
        if (gameState.timerId) {
            clearInterval(gameState.timerId);
        }
        
        // 提交分数到排行榜
        const leaderboardResult = await window.leaderboardManager.submitScore(gameState.score);
        
        // 检查是否破纪录
        const isNewRecord = saveHighScore(gameState.score);
        
        if (window.GameSounds) {
            window.GameSounds.playGameOverSound();
            
            if (gameState.score >= 1000 || isNewRecord || (leaderboardResult && leaderboardResult.isTopTen)) {
                setTimeout(() => {
                    window.GameSounds.playSuccessSound();
                }, 500);
            }
        }
        
        if (finalScoreDisplay) {
            finalScoreDisplay.textContent = gameState.score;
        }
        
        // 显示排名信息
        if (leaderboardResult && leaderboardResult.isTopTen) {
            showRankNotification(leaderboardResult.rank);
        }
        
        // 显示是否破纪录
        let recordDisplay = document.getElementById('recordDisplay');
        if (!recordDisplay) {
            recordDisplay = document.createElement('div');
            recordDisplay.id = 'recordDisplay';
            const finalScoreDiv = document.querySelector('.final-score');
            if (finalScoreDiv) {
                finalScoreDiv.appendChild(recordDisplay);
            }
        }
        
        if (recordDisplay) {
            let displayHTML = '';
            if (isNewRecord) {
                displayHTML = '<div class="new-record">🎉 新纪录！</div>';
            } else {
                displayHTML = `<div class="best-record">最高纪录: ${gameState.highScore}</div>`;
            }
            
            // 添加排行榜排名显示
            if (leaderboardResult && leaderboardResult.rank) {
                displayHTML += `<div class="leaderboard-rank">排行榜第 ${leaderboardResult.rank} 名</div>`;
            }
            
            recordDisplay.innerHTML = displayHTML;
        }
        
        // 处理奖励
        if (gameState.canGetReward && rewardSection) {
            const level = REWARD_LEVELS.find(l => gameState.score >= l.min && gameState.score <= l.max);
            
            if (level) {
                if (rewardLevel) {
                    rewardLevel.textContent = `🏆 ${level.name}`;
                }
                
                let rewardChoice = document.getElementById('rewardChoice');
                if (!rewardChoice) {
                    rewardChoice = document.createElement('div');
                    rewardChoice.id = 'rewardChoice';
                    rewardChoice.className = 'reward-choice';
                    rewardSection.appendChild(rewardChoice);
                }
                
                rewardChoice.innerHTML = `
                    <p>您有资格获得奖励，是否领取？</p>
                    <div class="choice-buttons">
                        <button class="choice-btn accept" onclick="acceptReward('${level.name}')">领取奖励</button>
                        <button class="choice-btn skip" onclick="skipReward()">跳过</button>
                    </div>
                    <p class="choice-hint">选择跳过也会消耗奖励次数</p>
                `;
                
                if (rewardCode) rewardCode.style.display = 'none';
                if (noStock) noStock.style.display = 'none';
            }
        } else if (rewardSection) {
            rewardSection.innerHTML = `
                <div class="practice-mode">
                    <h3>练习模式</h3>
                    <p>今日奖励次数已用完</p>
                    <p>继续练习，挑战更高分数！</p>
                </div>
            `;
        }
        
        if (endScreen) {
            endScreen.style.display = 'flex';
        }
        
        if (gameState.score >= 1000 || isNewRecord || (leaderboardResult && leaderboardResult.isTopTen)) {
            createCelebration();
        }
    }

    // 获取兑换码
    async function getRedeemCode(level) {
        try {
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
            
            const availableCode = codes.find(code => 
                code.level === level.name && !code.used
            );
            
            if (!availableCode) {
                return null;
            }
            
            availableCode.used = true;
            availableCode.usedAt = new Date().toISOString();
            
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
        if (!particlesContainer) return;
        
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
        if (codeText) {
            codeText.select();
            document.execCommand('copy');
            
            if (copyBtn) {
                copyBtn.textContent = '已复制！';
                copyBtn.style.background = 'linear-gradient(45deg, #00ff00, #00cc00)';
                
                setTimeout(() => {
                    copyBtn.textContent = '复制';
                    copyBtn.style.background = '';
                }, 2000);
            }
        }
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
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (window.GameSounds) {
                    window.GameSounds.playClickSound();
                }
                startGame();
            });
        }
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                if (window.GameSounds) {
                    window.GameSounds.playClickSound();
                }
                startGame();
            });
        }
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                if (window.GameSounds) {
                    window.GameSounds.playClickSound();
                }
                copyCode();
            });
        }
        
        // 查看排行榜按钮（结束界面）
        if (viewLeaderboardBtn) {
            viewLeaderboardBtn.addEventListener('click', async () => {
                if (window.GameSounds) {
                    window.GameSounds.playClickSound();
                }
                // 隐藏结束界面
                if (endScreen) {
                    endScreen.style.display = 'none';
                }
                // 显示排行榜
                await displayLeaderboard();
            });
        }
        
        if (canvas) {
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
            canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        }
        
        window.addEventListener('resize', handleResize);
        
        document.addEventListener('contextmenu', e => e.preventDefault());
    }

    // 初始化游戏
    async function init() {
        initCanvas();
        initEventListeners();
        initNickname();
        
        await checkGameStatus();
        
        if (!window.GameSounds) {
            const script = document.createElement('script');
            script.src = 'js/sounds.js';
            document.head.appendChild(script);
        }
    }

    // 初始化
    init();
});
