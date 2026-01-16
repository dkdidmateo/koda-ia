/**
 * index.js - Servidor (Backend) v3.1.4
 * KODA IA - Optimizado para RENDER.COM con correo dkdidmateo@gmail.com
 */

const express = require("express");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURACIÓN DE GOOGLE
const GOOGLE_API_KEY = "AIzaSyAsEvRJh4RX558n4-iFQuPlyVY4t-PAu9o";
const GOOGLE_CX = "213dcf6eb1f44462d"; 

const MEMORIA_PATH = path.join(__dirname, "memoria.json");
const PERFIL_PATH = path.join(__dirname, "perfil.json");
const FEEDBACK_PATH = path.join(__dirname, "feedback.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let historial = [];
let perfil = { nombre: null, ciudad: null };
let modoFeedback = {};

// Carga inicial de datos
try {
    if (fs.existsSync(MEMORIA_PATH)) historial = JSON.parse(fs.readFileSync(MEMORIA_PATH, "utf-8"));
    if (fs.existsSync(PERFIL_PATH)) perfil = JSON.parse(fs.readFileSync(PERFIL_PATH, "utf-8"));
} catch (e) { console.log("Iniciando con datos vacíos"); }

function guardar() {
    try {
        fs.writeFileSync(MEMORIA_PATH, JSON.stringify(historial, null, 2));
        fs.writeFileSync(PERFIL_PATH, JSON.stringify(perfil, null, 2));
    } catch (e) { console.log("Error al guardar"); }
}

const web = axios.create({ timeout: 7000 });

async function buscarGoogle(q) {
    try {
        const res = await axios.get("https://www.googleapis.com/customsearch/v1", {
            params: { key: GOOGLE_API_KEY, cx: GOOGLE_CX, q: q, hl: "es", num: 3 }
        });
        if (!res.data.items) return null;
        let r = `🌐 **RESULTADOS DE GOOGLE:**\n──────────────────────────\n\n`;
        res.data.items.forEach((item, i) => {
            r += `${i+1}. **${item.title}**\n${item.snippet}\n\n`;
        });
        return r + `──────────────────────────`;
    } catch (e) { return null; }
}

async function buscarWiki(q) {
    try {
        const res = await web.get(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`);
        if (res.data.extract) {
            return `📘 **WIKIPEDIA:**\n\n${res.data.extract}\n\n🔗 *Fuente: Wikipedia*`;
        }
        return null;
    } catch (e) { return null; }
}

async function obtenerClima(c) {
    try {
        const res = await web.get(`https://wttr.in/${encodeURIComponent(c)}?format=%C+%t+%w`);
        return `🌤️ **CLIMA EN ${c.toUpperCase()}:** ${res.data}`;
    } catch (e) { return "No pude obtener el clima."; }
}

async function responder(msg, ip) {
    const t = msg.toLowerCase().trim();

    // COMANDO CONTACTO ACTUALIZADO
    if (t === "/contacto" || t === "contacto") {
        return `📧 **INFORMACIÓN DE CONTACTO**\n──────────────────────────\nSi tienes alguna duda, propuesta o necesitas soporte técnico, puedes contactar directamente a mi creador:\n\n📩 **Gmail:** dkdidmateo@gmail.com\n\n_Koda IA está siempre a tu disposición._`;
    }

    if (modoFeedback[ip]) {
        delete modoFeedback[ip];
        return "✅ **Feedback guardado.** Gracias por ayudar a mejorar Koda IA.";
    }
    if (t === "/feedback") {
        modoFeedback[ip] = true;
        return "🛠️ **MODO FEEDBACK:** Describe el error o sugerencia.";
    }

    if (t === "hola") return `¡Hola${perfil.nombre ? " " + perfil.nombre : ""}! Soy Koda IA, ¿en qué puedo ayudarte hoy?`;
    if (t.includes("como estas")) return "¡Excelente! Estoy operando en la nube y listo para trabajar.";
    if (t.includes("gracias")) return "¡De nada! Es un placer serte útil.";

    if (t.includes("chiste")) return "¿Qué hace una abeja en el gimnasio? ¡Zumba!";

    if (t.includes("me llamo")) {
        perfil.nombre = msg.split(/me llamo/i)[1]?.trim();
        guardar();
        return `Entendido, te llamaré **${perfil.nombre}**.`;
    }

    if (t.includes("clima") || t.includes("tiempo")) {
        let ciudad = t.split("en")[1]?.trim() || perfil.ciudad || "Madrid";
        return await obtenerClima(ciudad);
    }

    if (t.includes("busca") || t.includes("google") || t.includes("investiga")) {
        const q = msg.replace(/busca|google|investiga/gi, "").trim();
        const g = await buscarGoogle(q || msg);
        if (g) return g;
    }

    const w = await buscarWiki(msg);
    if (w) return w;

    return `No encontré información directa sobre "${msg}". ¿Quieres que lo busque en Google? (Dime "Busca ${msg}")`;
}

app.post("/chat", async (req, res) => {
    const { mensaje } = req.body;
    const ip = req.ip;
    historial.push({ rol: "usuario", texto: mensaje });
    
    try {
        const respuesta = await responder(mensaje, ip);
        historial.push({ rol: "bot", texto: respuesta });
        guardar();
        res.json({ respuesta });
    } catch (e) {
        res.json({ respuesta: "Lo siento, tuve un error interno. Intenta de nuevo." });
    }
});

app.get("/historial", (req, res) => res.json(historial));
app.delete("/historial", (req, res) => { historial = []; guardar(); res.json({ ok: true }); });
app.get("/health", (req, res) => res.send("OK"));

app.listen(PORT, () => {
    console.log(`🚀 KODA IA v3.1.4 - ONLINE EN PUERTO ${PORT}`);
});
