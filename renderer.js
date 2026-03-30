// Persistent Settings
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ai-prompt').value = localStorage.getItem('aiPrompt') || "Best Answer as human based on Question";
    document.getElementById('api-key').value = localStorage.getItem('apiKey') || "";
});

const takeBtn = document.getElementById('take-screenshot');
const previewArea = document.getElementById('preview-area');
const previewImg = document.getElementById('screenshot-preview');
const loader = document.getElementById('inline-loader');
const answerContainer = document.getElementById('answer-container');
const answerText = document.getElementById('answer-text');

window.electronAPI.onMenuToggleSettings(() => {
    const settingsDiv = document.getElementById('settings');
    settingsDiv.classList.toggle('hidden');
});

// Save settings logic stays
document.getElementById('save-settings').onclick = () => {
    localStorage.setItem('aiPrompt', document.getElementById('ai-prompt').value);
    localStorage.setItem('apiKey', document.getElementById('api-key').value);
    alert("Saved!");
    document.getElementById('settings').classList.add('hidden');
};
// 2. Take Screenshot
takeBtn.onclick = async () => {
    answerContainer.classList.add('hidden'); // Hide old answers
    try {
        const result = await window.electronAPI.takeScreenshot();
        if (result.success) {
            previewImg.src = result.data;
            previewArea.classList.remove('hidden');
            takeBtn.classList.add('hidden');
        }
    } catch (e) { alert("Capture failed"); }
};

// 3. Generate AI Answer (The Magic Part)
document.getElementById('send-btn').onclick = async () => {
    const apiVal = document.getElementById('api-key').value;
    const promptVal = document.getElementById('ai-prompt').value;

    if (!apiVal) return alert("Enter API Key first!");

    // SEQUENCE START: Hide preview/btns, show loader
    previewArea.classList.add('hidden'); 
    loader.classList.remove('hidden');

    try {
        const blobRes = await fetch(previewImg.src);
        const blob = await blobRes.blob();
        const file = new File([blob], "screenshot.png", { type: "image/png" });

        const formData = new FormData();
        formData.append('screenshot', file);
        formData.append('api', apiVal);
        formData.append('profile', promptVal);

        const response = await fetch('https://blogcutter.com/api/survey', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        // SEQUENCE END: Show Answer and bring back the Screenshot button
        loader.classList.add('hidden');
        
        if (result.status === 'success') {
            answerText.innerText = result.message;
            answerContainer.classList.remove('hidden');
        } else {
            alert("Error: " + result.message);
        }
        
        takeBtn.classList.remove('hidden'); // Show take screenshot btn again

    } catch (e) {
        loader.classList.add('hidden');
        takeBtn.classList.remove('hidden');
        alert("Upload Failed: " + e.message);
    }
};

// 4. Copy to Clipboard
document.getElementById('copy-btn').onclick = () => {
    navigator.clipboard.writeText(answerText.innerText);
    const originalText = document.getElementById('copy-btn').innerText;
    document.getElementById('copy-btn').innerText = "✅ Copied!";
    setTimeout(() => { document.getElementById('copy-btn').innerText = originalText; }, 2000);
};

// 5. Delete Logic
// Change this part in your renderer.js
document.getElementById('delete-icon').onclick = () => {
    // Hide the whole preview area
    document.getElementById('preview-area').classList.add('hidden');
    
    // Show the "Take Screenshot" button again
    document.getElementById('take-screenshot').classList.remove('hidden');
    
    // Clear the image source to save memory
    document.getElementById('screenshot-preview').src = "";
};

// Listener for the "Balance" click from the Top Menu
window.electronAPI.onCheckBalance(async () => {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
        alert("Please set and save your API Key in Settings first!");
        return;
    }

    try {
        // Calling your specific Laravel Profile Endpoint
        const response = await fetch(`https://blogcutter.com/api/profile/survey/${apiKey}`);
        const data = await response.json();

        if (data.status === 'success') {
            alert(`Hello ${data.name}!\nPlan: ${data.plan_name}\nBalance: ${data.balance}\nDate: ${data.todays_date}`);
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        alert("Could not connect to server to check balance.");
    }
});

// Cancel Button Logic
document.getElementById('cancel-settings').onclick = () => {
    const settingsDiv = document.getElementById('settings');
    
    // Hide the settings panel
    settingsDiv.classList.add('hidden');
    
    // Optional: Reset the inputs to the last saved values if the user typed something
    const savedPrompt = localStorage.getItem('aiPrompt');
    const savedApi = localStorage.getItem('apiKey');
    
    if (savedPrompt) document.getElementById('ai-prompt').value = savedPrompt;
    if (savedApi) document.getElementById('api-key').value = savedApi;
};