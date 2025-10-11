// 音效生成器
class SoundGenerator {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // 播放收集星尘的音效
    playCollectSound(type = 'pink') {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 根据星尘类型设置不同的音调
        switch(type) {
            case 'pink':
                oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
                oscillator.frequency.exponentialRampToValueAtTime(1046.50, this.audioContext.currentTime + 0.1); // C6
                break;
            case 'green':
                oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime); // E5
                oscillator.frequency.exponentialRampToValueAtTime(1318.51, this.audioContext.currentTime + 0.1); // E6
                break;
            case 'rainbow':
                // 彩虹星尘播放和弦
                this.playRainbowChord();
                return;
        }
        
        oscillator.type = 'sine';
        
        // 音量淡出
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    // 播放彩虹星尘的和弦音效
    playRainbowChord() {
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C大调和弦)
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 2, this.audioContext.currentTime + 0.3);
            
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
            
            oscillator.start(this.audioContext.currentTime + index * 0.05);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        });
    }
    
    // 播放黑洞碰撞音效
    playBlackHoleSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 低频震动
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.5);
        
        oscillator.type = 'sawtooth';
        
        // 低通滤波器
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
        
        // 音量控制
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
        
        // 添加噪音效果
        this.playNoise();
    }
    
    // 播放噪音（用于黑洞效果）
    playNoise() {
        const bufferSize = this.audioContext.sampleRate * 0.2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.buffer = buffer;
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        filter.type = 'bandpass';
        filter.frequency.value = 100;
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        noise.start(this.audioContext.currentTime);
    }
    
    // 播放按钮点击音效
    playClickSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }
    
    // 播放游戏结束音效
    playGameOverSound() {
        const frequencies = [523.25, 493.88, 440, 392, 349.23]; // 下降音阶
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 100);
        });
    }
    
    // 播放倒计时警告音
    playWarningSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5
        oscillator.type = 'square';
        
        // 快速脉冲
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // 播放成功音效（获得高分时）
    playSuccessSound() {
        const notes = [
            { freq: 523.25, time: 0 },      // C5
            { freq: 659.25, time: 0.1 },    // E5
            { freq: 783.99, time: 0.2 },    // G5
            { freq: 1046.50, time: 0.3 }    // C6
        ];
        
        notes.forEach(note => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = note.freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.4);
            }, note.time * 1000);
        });
    }
}

// 创建全局音效实例
const soundGenerator = new SoundGenerator();

// 导出给游戏使用
window.GameSounds = soundGenerator;
