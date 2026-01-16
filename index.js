/**
 * index.js - Frontend v3.1.1
 * KODA IA - Con Sugerencias Restauradas
 */

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('prompt-textarea');
    const submitBtn = document.getElementById('composer-submit-button');
    const chatArea = document.getElementById('chat-area');
    const welcomeSection = document.getElementById('welcome-section');
    const suggestionsGrid = document.getElementById('suggestions-grid');
    
    const newChatBtn = document.getElementById('new-chat-btn');
    const jokeBtn = document.getElementById('joke-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    let isSending = false;

    const bancoSugerencias = [
        { h: "🔍 Google", p: "Busca sobre la inteligencia artificial", q: "Busca sobre la inteligencia artificial" },
        { h: "🌦️ Clima", p: "¿Cómo está el tiempo hoy?", q: "Clima" },
        { h: "📰 Noticias", p: "Investiga las noticias de hoy", q: "Noticias de hoy" },
        { h: "🧠 Ciencia", p: "¿Qué es la física cuántica?", q: "Física cuántica" }
    ];

    const cargarSugerencias = () => {
        if (!suggestionsGrid) return;
        suggestionsGrid.innerHTML = '';
        const barajado = bancoSugerencias.sort(() => 0.5 - Math.random()).slice(0, 4);
        barajado.forEach(s => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `<h3>${s.h}</h3><p>${s.p}</p>`;
            card.onclick = () => sendMessage(s.q);
            suggestionsGrid.appendChild(card);
        });
    };

    const addMessage = (text, sender) => {
        if (welcomeSection) welcomeSection.style.display = 'none';
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        chatArea.appendChild(div);
        chatArea.scrollTop = chatArea.scrollHeight;
    };

    const sendMessage = async (customText = null) => {
        const text = customText || textarea.value.trim();
        if (!text || isSending) return;

        isSending = true;
        submitBtn.disabled = true;
        addMessage(text, 'user');
        if (!customText) textarea.value = '';

        const thinking = document.createElement('div');
        thinking.className = 'message assistant';
        thinking.textContent = 'Koda IA está pensando...';
        chatArea.appendChild(thinking);

        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: text })
            });
            const data = await res.json();
            thinking.innerHTML = data.respuesta.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } catch (e) {
            thinking.textContent = "Error de conexión.";
        } finally {
            isSending = false;
            submitBtn.disabled = false;
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    };

    textarea.addEventListener('input', () => {
        submitBtn.disabled = textarea.value.trim() === '';
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    });

    textarea.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    submitBtn.addEventListener('click', () => sendMessage());
    newChatBtn.addEventListener('click', () => window.location.reload());
    jokeBtn.addEventListener('click', () => sendMessage("Cuéntame un chiste"));
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('¿Borrar todo?')) {
            await fetch('/historial', { method: 'DELETE' });
            window.location.reload();
        }
    });

    // Cargar historial y sugerencias
    cargarSugerencias();
    fetch('/historial').then(r => r.json()).then(h => {
        if (h.length > 0) h.forEach(m => addMessage(m.texto, m.rol === 'usuario' ? 'user' : 'assistant'));
    });
});