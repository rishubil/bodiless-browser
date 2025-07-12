import { invoke } from '@tauri-apps/api/core'

window.checkUrl = async function() {
    const urlInput = document.getElementById('urlInput');
    const checkBtn = document.getElementById('checkBtn');
    const result = document.getElementById('result');
    const loading = document.getElementById('loading');
    const resultContent = document.getElementById('resultContent');
    const errorContent = document.getElementById('errorContent');

    const url = urlInput.value.trim();
    
    if (!url) {
        alert('Please enter a URL!');
        return;
    }

    // URL format validation
    try {
        new URL(url);
    } catch {
        alert('Please enter a valid URL!');
        return;
    }

    // Change UI state
    checkBtn.disabled = true;
    checkBtn.textContent = 'Loading...';
    result.classList.add('show');
    loading.style.display = 'block';
    resultContent.style.display = 'none';
    errorContent.style.display = 'none';

    try {
        const startTime = Date.now();
        
        // Call Tauri backend function
        const response = await invoke('check_url', { url });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Display results
        document.getElementById('statusCode').textContent = response.status_code;
        document.getElementById('statusCode').className = getStatusClass(response.status_code);
        
        document.getElementById('pageTitle').textContent = response.title || 'No title';
        document.getElementById('responseTime').textContent = `${responseTime}ms`;
        document.getElementById('contentSize').textContent = formatBytes(response.content_size || 0);

        loading.style.display = 'none';
        resultContent.style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        
        document.getElementById('errorMessage').textContent = 
            `Request failed: ${error.message || 'Unknown error'}`;
        
        loading.style.display = 'none';
        errorContent.style.display = 'block';
    } finally {
        checkBtn.disabled = false;
        checkBtn.textContent = 'Go';
    }
}

function getStatusClass(statusCode) {
    if (statusCode >= 200 && statusCode < 300) {
        return 'result-value status-ok';
    } else if (statusCode >= 400) {
        return 'result-value status-error';
    } else {
        return 'result-value status-warning';
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Enter key event handling
document.getElementById('urlInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkUrl();
    }
});

console.log('😵 Bodiless Browser has started!');
