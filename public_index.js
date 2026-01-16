/**
 * public/index.js - Lógica del Navegador
 * Este archivo debe ir DENTRO de la carpeta 'public'
 */

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('prompt-textarea');
    const submitBtn = document.getElementById('composer-submit-button');
    const chatArea = document.getElementById('chat-area');
    const welcomeSection = document.getElementById('welcome-section');
    
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const statusBtn = document.getElementById('status-btn');

    const autoResize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    };

    const toggleSubmitButton = () => {
        submitBtn.disabled = textarea.value.trim() === '';
    };

    const addMessage = (text, sender) => {
        if (welcomeSection) welcomeSection.style.display = 'none';
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.style.whiteSpace = 'pre-wrap';
        messageDiv.textContent = text;
        chatArea.appendChild(messageDiv);
        chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
    };

    const sendMessage = async () => {
        const text = textarea.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        textarea.value = '';
        autoResize();
        toggleSubmitButton();

        const thinkingId = 'thinking-' + Date.now();
        const thinkingDiv = document.createElement('div');
        thinkingDiv.id = thinkingId;
        thinkingDiv.className = 'message assistant';
        thinkingDiv.textContent = 'Arsxolito está pensando...';
        chatArea.appendChild(thinkingDiv);

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: text })
            });
            const data = await response.json();
            document.getElementById(thinkingId).textContent = data.respuesta || "Sin respuesta.";
        } catch (error) {
            document.getElementById(thinkingId).textContent = "Error: No se pudo conectar con el servidor.";
        }
    };

    textarea.addEventListener('input', () => { autoResize(); toggleSubmitButton(); });
    textarea.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    submitBtn.addEventListener('click', sendMessage);
    if(newChatBtn) newChatBtn.addEventListener('click', () => window.location.reload());
    
    if(clearHistoryBtn) clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('¿Borrar historial?')) {
            await fetch('/historial', { method: 'DELETE' });
            window.location.reload();
        }
    });

    if(statusBtn) statusBtn.addEventListener('click', async () => {
        try {
            const res = await fetch('/status');
            const data = await res.json();
            alert(`Estado: ${data.status}\nMensajes: ${data.mensajes}`);
        } catch (e) { alert('Servidor offline'); }
    });

    window.useSuggestion = (text) => {
        textarea.value = text;
        textarea.focus();
        autoResize();
        toggleSubmitButton();
    };

    const init = async () => {
        try {
            const res = await fetch('/historial');
            const historial = await res.json();
            if (historial && historial.length > 0) {
                historial.forEach(item => addMessage(item.texto, item.rol === 'usuario' ? 'user' : 'assistant'));
            }
        } catch (e) {}
    };
    init();
});
