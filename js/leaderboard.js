// 排行榜配置
const LEADERBOARD_CONFIG = {
    binId: '68eba21443b1c97be963feb0',
    apiKey: '$2a$10$mH6NOaN4gioCKLSvrH5jYO8/w2d8m6jBwDxsShll0OuywReLUppE6',
    apiUrl: 'https://api.jsonbin.io/v3/b/'
};

// 排行榜管理器
class LeaderboardManager {
    constructor() {
        this.leaderboard = [];
        this.playerNickname = localStorage.getItem('playerNickname') || '';
    }

    // 验证昵称
    validateNickname(nickname) {
        if (!nickname || nickname.trim() === '') {
            return { valid: false, error: '昵称不能为空' };
        }

        // 移除空格后检查
        const trimmed = nickname.trim();
        
        // 检查是否包含符号（只允许中文、英文、数字）
        const validPattern = /^[\u4e00-\u9fa5a-zA-Z0-9]+$/;
        if (!validPattern.test(trimmed)) {
            return { valid: false, error: '昵称只能包含中文、英文和数字' };
        }

        // 计算长度（中文算2个字符，英文算1个）
        let length = 0;
        for (let i = 0; i < trimmed.length; i++) {
            if (/[\u4e00-\u9fa5]/.test(trimmed[i])) {
                length += 2;
            } else {
                length += 1;
            }
        }

        if (length > 12) {
            return { valid: false, error: '昵称过长（最多6个汉字或12个英文）' };
        }

        return { valid: true, nickname: trimmed };
    }

    // 设置昵称
    setNickname(nickname) {
        const validation = this.validateNickname(nickname);
        if (validation.valid) {
            this.playerNickname = validation.nickname;
            localStorage.setItem('playerNickname', this.playerNickname);
            return { success: true };
        }
        return { success: false, error: validation.error };
    }

    // 获取昵称
    getNickname() {
        return this.playerNickname;
    }

    // 清除昵称
    clearNickname() {
        this.playerNickname = '';
        localStorage.removeItem('playerNickname');
    }

    // 从服务器加载排行榜
    async loadLeaderboard() {
        try {
            const response = await fetch(`${LEADERBOARD_CONFIG.apiUrl}${LEADERBOARD_CONFIG.binId}/latest`, {
                headers: {
                    'X-Master-Key': LEADERBOARD_CONFIG.apiKey
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }

            const data = await response.json();
            this.leaderboard = data.record.leaderboard || [];
            
            // 确保排行榜按分数降序排列
            this.leaderboard.sort((a, b) => b.score - a.score);
            
            // 只保留前10名
            this.leaderboard = this.leaderboard.slice(0, 10);
            
            return this.leaderboard;
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // 如果加载失败，返回空数组
            this.leaderboard = [];
            return [];
        }
    }

    // 保存排行榜到服务器
    async saveLeaderboard() {
        try {
            const response = await fetch(`${LEADERBOARD_CONFIG.apiUrl}${LEADERBOARD_CONFIG.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': LEADERBOARD_CONFIG.apiKey
                },
                body: JSON.stringify({ leaderboard: this.leaderboard })
            });

            if (!response.ok) {
                throw new Error('Failed to save leaderboard');
            }

            return true;
        } catch (error) {
            console.error('Error saving leaderboard:', error);
            return false;
        }
    }

    // 提交分数
    async submitScore(score) {
        if (!this.playerNickname) {
            console.error('No nickname set');
            return { success: false, error: 'No nickname' };
        }

        // 加载最新排行榜
        await this.loadLeaderboard();

        // 创建新记录
        const newEntry = {
            nickname: this.playerNickname,
            score: score,
            timestamp: new Date().toISOString(),
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        };

        // 查找是否已有该玩家的记录
        const existingIndex = this.leaderboard.findIndex(entry => entry.nickname === this.playerNickname);
        
        if (existingIndex !== -1) {
            // 如果新分数更高，更新记录
            if (score > this.leaderboard[existingIndex].score) {
                this.leaderboard[existingIndex] = newEntry;
            }
        } else {
            // 添加新记录
            this.leaderboard.push(newEntry);
        }

        // 重新排序
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // 只保留前10名
        this.leaderboard = this.leaderboard.slice(0, 10);

        // 检查是否进入前10
        const rank = this.leaderboard.findIndex(entry => entry.id === newEntry.id) + 1;
        
        // 保存到服务器
        const saved = await this.saveLeaderboard();
        
        return {
            success: saved,
            rank: rank > 0 ? rank : null,
            isTopTen: rank > 0 && rank <= 10
        };
    }

    // 获取玩家排名
    getPlayerRank() {
        if (!this.playerNickname) return null;
        
        const index = this.leaderboard.findIndex(entry => entry.nickname === this.playerNickname);
        return index !== -1 ? index + 1 : null;
    }

    // 格式化排行榜显示
    formatLeaderboard() {
        return this.leaderboard.map((entry, index) => ({
            rank: index + 1,
            nickname: entry.nickname,
            score: entry.score,
            timestamp: entry.timestamp,
            isCurrentPlayer: entry.nickname === this.playerNickname
        }));
    }
}

// 创建全局排行榜管理器实例
window.leaderboardManager = new LeaderboardManager();
