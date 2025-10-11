// 安全防护脚本
(function() {
    'use strict';
    
    // 禁用右键菜单
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // 禁用文本选择
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // 禁用F12和其他开发者工具快捷键
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+I (开发者工具)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+J (控制台)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+C (检查元素)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+U (查看源代码)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    });
    
    // 检测开发者工具
    let devtools = {open: false, orientation: null};
    const threshold = 160;
    const emitEvent = (state, orientation) => {
        if (state) {
            console.clear();
            document.getElementById('debugger-warning').style.display = 'flex';
            setTimeout(() => {
                document.body.innerHTML = '<h1 style="text-align:center;margin-top:50vh;transform:translateY(-50%);">⚠️ 检测到非法操作</h1>';
            }, 3000);
        }
    };
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                emitEvent(true, null);
                devtools.open = true;
            }
        } else {
            if (devtools.open) {
                emitEvent(false, null);
                devtools.open = false;
            }
        }
    }, 500);
    
    // 禁用调试器
    setInterval(() => {
        debugger;
    }, 100);
    
    // 控制台警告
    console.log('%c⚠️ 警告！', 'color: red; font-size: 30px; font-weight: bold;');
    console.log('%c此浏览器功能专供开发人员使用。', 'color: red; font-size: 16px;');
    console.log('%c请勿在此粘贴或运行任何代码！', 'color: red; font-size: 16px;');
    
})();
