const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
let inventario = [], carrito = [];

function showToast(msj, tipo = "success") {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    div.className = "toast";
    if(tipo === "error") div.style.background = "#dc3545";
    div.innerText = msj;
    container.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

function guardarUsuario(){
    const u = document.getElementById("usuario").value.toLowerCase();
    const p = document.getElementById("password").value;
    if(usuariosSistema[u] === p){
        localStorage.setItem("user_kamiara", u);
        location.reload();
    } else {
        alert("Datos incorrectos");
    }
}

function cerrarSesion(){ localStorage.removeItem("user_kamiara"); location.reload(); }

window.onload = () => {
    const user = localStorage.getItem("user_kamiara");
    if(user){
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "flex";
        document.getElementById("userInfo").innerText = "USUARIO: " + user.toUpperCase();
        cargarDatos();
    }
};

function cargarDatos() {
    fetch("https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO")
    .then(r => r.json())
    .then(data => {
        inventario = data.map(p => ({
            id: p.ID, producto: p.PRODUCTO, categoria: p.CATEGORIA.toUpperCase(),
            talla: p.TALLA, color: p.COLOR, stock: parseInt(p.STOCK),
            unidad: parseFloat(p["P.UNIDAD"]), docena: parseFloat(p["P.DOCENA"]), imagen: p.IMAGEN
        }));
    });
}

function abrir(cat) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "grid";
    const filtrados = inventario.filter(p => p.categoria === cat);
    const unicos = {}; 
    filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });

    let html = "";
    Object.values(unicos).forEach(p => {
        html += `<div class="card" onclick="verProducto('${p.id}')">
            <img src="${p.imagen}">
            <div style="padding:10px;">
                <h3 style="font-size:13px; margin:0;">${p.producto}</h3>
                <p style="color:lime; margin:5px 0 0;">S/ ${p.unidad}</p>
            </div>
        </div>`;
    });
    document.getElementById("productos").innerHTML = html + `<button onclick="inicio()" style="grid-column:span 2; padding:10px; background:#333; color:white; border:none; border-radius:8px;">⬅ VOLVER</button>`;
}

function verProducto(id) {
    const variantes = inventario.filter(v => v.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];

    document.getElementById("productos").innerHTML = `
        <div class="detalle-container">
            <img src="${p.imagen}">
            <h2 style="margin:10px 0;">${p.producto}</h2>
            <div style="display:flex; gap:10px; margin-bottom:15px;">
                <div style="flex:1;">Talla: <select id="selTalla" style="width:100%; padding:8px;" onchange="actualizarColores('${id}')">${tallas.map(t => `<option value="${t}">${t}</option>`).join("")}</select></div>
                <div style="flex:1;">Color: <select id="selColor" style="width:100%; padding:8px;"></select></div>
            </div>
            <button onclick="agregarAlCarrito('${id}')" style="width:100%; padding:15px; background:#28a745; color:white; border:none; border-radius:10px; font-weight:bold;">AÑADIR AL CARRITO</button>
            <button onclick="inicio()" style="width:100%; padding:10px; background:none; color:gray; border:none; margin-top:10px;">⬅ Volver</button>
        </div>`;
    actualizarColores(id);
}

function actualizarColores(id) {
    const t = document.getElementById("selTalla").value;
    const colores = inventario.filter(v => v.id == id && v.talla == t);
    document.getElementById("selColor").innerHTML = colores.map(c => `<option value="${c.color}">${c.color} (Stock: ${c.stock})</option>`).join("");
}

function agregarAlCarrito(id) {
    const t = document.getElementById("selTalla").value;
    const c = document.getElementById("selColor").value;
    const item = inventario.find(p => p.id == id && p.talla == t && p.color == c);
    
    const existe = carrito.find(x => x.id == id && x.talla == t && x.color == c);
    if(existe) existe.cantidad++;
    else carrito.push({...item, cantidad: 1});

    showToast("Añadido al carrito");
    actualizarContador();
}

function actualizarContador() {
    const n = carrito.reduce((a, b) => a + b.cantidad, 0);
    document.getElementById("btnVerCarrito").innerText = `🛒 Carrito (${n})`;
}

function verCarrito() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito").style.display = "block";
    renderCarrito();
}

function renderCarrito() {
    const lista = document.getElementById("lista-carrito");
    let html = "", total = 0;
    carrito.forEach((item, i) => {
        const precio = item.cantidad >= 12 ? item.docena : item.unidad;
        const sub = precio * item.cantidad;
        total += sub;
        html += `<div class="item-carrito">
            <div style="display:flex; justify-content:space-between;"><b>${item.producto}</b> <span onclick="borrar(${i})" style="color:red; cursor:pointer;">✕</span></div>
            <div class="grid-carrito">
                <span>${item.talla} | ${item.color}</span>
                <span>Cant: ${item.cantidad}</span>
                <span>S/ ${sub.toFixed(2)}</span>
            </div>
        </div>`;
    });
    lista.innerHTML = html || "<p style='text-align:center; color:gray;'>Carrito vacío</p>";
    document.getElementById("precioTotalCarrito").innerText = `S/ ${total.toFixed(2)}`;
}

function borrar(i) { carrito.splice(i, 1); renderCarrito(); actualizarContador(); showToast("Eliminado", "error"); }
function inicio() { location.reload(); }
function pagar() { alert("Pedido enviado"); carrito = []; inicio(); }
