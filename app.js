// CONFIGURACIÓN DE USUARIOS
const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];

// VARIABLES GLOBALES
let inventario = [];
let carrito = [];
let valorDescuento = 0;

// INICIALIZACIÓN
window.onload = () => {
    const user = localStorage.getItem("usuario");
    document.getElementById("login").style.display = user ? "none" : "flex";
    document.getElementById("app").style.display = user ? "block" : "none";

    if (user) {
        document.getElementById("userInfo").innerHTML = `👤 ${user.toUpperCase()}`;
        if (admins.includes(user)) document.getElementById("panelBtn").style.display = "inline-block";
        cargarInventario();
    }
};

// GESTIÓN DE SESIÓN
function guardarUsuario() {
    const user = document.getElementById("usuario").value.toLowerCase();
    const pass = document.getElementById("password").value;
    if (!usuariosSistema[user] || usuariosSistema[user] !== pass) {
        return document.getElementById("errorLogin").innerText = "Credenciales incorrectas";
    }
    localStorage.setItem("usuario", user);
    location.reload();
}

function cerrarSesion() {
    localStorage.removeItem("usuario");
    location.reload();
}

// CARGAR DATOS DESDE GOOGLE SHEETS
function cargarInventario() {
    const urlInv = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
    fetch(urlInv)
        .then(r => r.json())
        .then(d => {
            inventario = d.map(p => {
                let o = {};
                Object.keys(p).forEach(k => o[k.toLowerCase().trim()] = p[k]);
                return {
                    id: o.id, producto: o.producto, categoria: (o.categoria || "").toUpperCase(),
                    talla: o.talla, color: o.color, stock: parseInt(o.stock) || 0,
                    unidad: parseFloat(o["p.unidad"]) || 0, docena: parseFloat(o["p.docena"]) || 0, imagen: o.imagen
                };
            });
        });
}

// NAVEGACIÓN
function abrir(cat) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("portada").style.display = "none";
    const contenedor = document.getElementById("productos");
    contenedor.style.display = "grid";

    const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
    const unicos = {};
    filtrados.forEach(p => { if (!unicos[p.id]) unicos[p.id] = p; });

    let html = "";
    Object.values(unicos).forEach(p => {
        html += `
        <div class="card" onclick="verProducto('${p.id}')">
            <img src="${p.imagen}">
            <h3>${p.producto}</h3>
            <p style="color:lime; font-weight:bold;">S/ ${p.unidad}</p>
        </div>`;
    });
    contenedor.innerHTML = html + `<button style="background:#333; grid-column: span 2;" onclick="inicio()">⬅ Volver</button>`;
}

function inicio() {
    document.getElementById("menu").style.display = "grid";
    document.getElementById("portada").style.display = "block";
    document.getElementById("productos").style.display = "none";
    document.getElementById("seccion-carrito").style.display = "none";
    document.getElementById("panel").style.display = "none";
}

// DETALLE DE PRODUCTO
function verProducto(id) {
    const variantes = inventario.filter(p => p.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];
    const stockTotal = variantes.reduce((a, b) => a + b.stock, 0);

    document.getElementById("productos").innerHTML = `
        <div style="grid-column: span 2;">
            <img class="detalle-img" src="${p.imagen}">
            <h2>${p.producto}</h2>
            <div class="fila-opciones">
                <div>🧵 TALLAS <select id="tallaSelect" onchange="cambiarTalla('${id}')">
                    ${tallas.map(t => `<option value="${t}">${t}</option>`).join("")}
                    <option value="TODAS">TODAS</option>
                </select></div>
                <div>📦 STOCK <span class="stock" id="stockTalla">0</span></div>
                <div>📊 TOTAL <span class="total">${stockTotal}</span></div>
            </div>
            <table id="tablaDetalle"></table>
            <button onclick="prepararCaptura('${id}')" style="background:#28a745; margin-top:20px;">🛒 Añadir al Carrito</button>
            <button onclick="abrir('${p.categoria}')" style="background:#333;">⬅ Volver</button>
        </div>
    `;
    cambiarTalla(id);
}

function cambiarTalla(id) {
    const talla = document.getElementById("tallaSelect").value;
    let filtrados = talla === "TODAS" ? inventario.filter(p => p.id == id) : inventario.filter(p => p.id == id && p.talla == talla);
    document.getElementById("stockTalla").innerText = filtrados.reduce((a, b) => a + b.stock, 0);

    let filas = `<tr><th>TALLA</th><th>COLOR</th><th>STOCK</th><th>S/ UNID</th></tr>`;
    filtrados.forEach(v => {
        filas += `<tr><td>${v.talla}</td><td>${v.color}</td><td>${v.stock}</td><td>${v.unidad}</td></tr>`;
    });
    document.getElementById("tablaDetalle").innerHTML = filas;
}

// LÓGICA DEL CARRITO
function showToast(msj, tipo) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${tipo}`;
    toast.innerText = msj;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function prepararCaptura(id) {
    const t = document.getElementById("tallaSelect").value;
    const item = inventario.find(p => p.id == id && (t === "TODAS" ? true : p.talla === t) && p.stock > 0);
    if (item) agregarAlCarrito(item);
    else showToast("❌ Sin stock disponible", "error");
}

function agregarAlCarrito(item) {
    const existente = carrito.find(p => p.id == item.id && p.talla == item.talla && p.color == item.color);
    if (existente) existente.cantidad++;
    else carrito.push({ ...item, cantidad: 1 });

    showToast("✅ Añadido al carrito", "success");
    actualizarContador();
}

function actualizarContador() {
    document.getElementById("cart-count").innerText = carrito.reduce((a, b) => a + b.cantidad, 0);
}

function mostrarCarrito() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "none";
    document.getElementById("portada").style.display = "none";
    document.getElementById("seccion-carrito").style.display = "block";
    renderizarCarrito();
}

function aplicarDescuento() {
    const val = parseFloat(document.getElementById("inputDescuento").value);
    if (!isNaN(val) && val >= 0) {
        valorDescuento = val;
        showToast(`✅ Descuento de S/ ${val.toFixed(2)}`, "success");
    } else {
        valorDescuento = 0;
        showToast("❌ Valor inválido", "error");
    }
    renderizarCarrito();
}

function renderizarCarrito() {
    const lista = document.getElementById("lista-carrito");
    let html = "";
    let subtotal = 0;

    const conteoPorID = {};
    carrito.forEach(p => { conteoPorID[p.id] = (conteoPorID[p.id] || 0) + p.cantidad; });

    carrito.forEach((p, index) => {
        const precio = conteoPorID[p.id] >= 12 ? p.docena : p.unidad;
        const totalFila = precio * p.cantidad;
        subtotal += totalFila;

        html += `
        <div class="item-carrito">
            <div><b>${p.producto}</b><br><small>${p.talla} | ${p.color}</small></div>
            <div class="txt-center">
                <button style="background:none; color:white; font-size:18px;" onclick="cambiarCant(${index},-1)">-</button>
                ${p.cantidad}
                <button style="background:none; color:white; font-size:18px;" onclick="cambiarCant(${index},1)">+</button>
            </div>
            <div class="txt-center">S/${precio.toFixed(2)}</div>
            <div class="txt-right">S/${totalFila.toFixed(2)}</div>
        </div>`;
    });

    lista.innerHTML = html || "<p style='text-align:center;'>Carrito vacío</p>";
    document.getElementById("subtotalCarrito").innerText = `S/ ${subtotal.toFixed(2)}`;
    let total = subtotal - valorDescuento;
    document.getElementById("totalFinalCarrito").innerText = `S/ ${(total < 0 ? 0 : total).toFixed(2)}`;
}

function cambiarCant(i, v) {
    carrito[i].cantidad += v;
    if (carrito[i].cantidad <= 0) {
        carrito.splice(i, 1);
        showToast("❌ Eliminado", "error");
    }
    renderizarCarrito();
    actualizarContador();
}

// PANEL ADMIN
function abrirPanel() { document.getElementById("menu").style.display = "none"; document.getElementById("panel").style.display = "block"; }
function abrirFormulario() { window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
