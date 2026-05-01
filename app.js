const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [], carrito = [], descuentoGlobal = 0;

// SISTEMA DE NOTIFICACIONES
function showToast(msj, tipo = "success") {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    div.className = `toast ${tipo === "error" ? "error" : ""}`;
    div.innerText = msj;
    container.appendChild(div);
    setTimeout(() => {
        div.style.opacity = "0";
        setTimeout(() => div.remove(), 500);
    }, 2500);
}

// GESTIÓN DE SESIÓN
function guardarUsuario(){
    const user = document.getElementById("usuario").value.toLowerCase().trim();
    const pass = document.getElementById("password").value;
    if(!usuariosSistema[user] || usuariosSistema[user] !== pass) {
        document.getElementById("errorLogin").innerText = "Usuario o contraseña incorrectos";
        return;
    }
    localStorage.setItem("at_user", user);
    location.reload();
}

function cerrarSesion(){ localStorage.removeItem("at_user"); location.reload(); }

window.onload = () => {
    const user = localStorage.getItem("at_user");
    if(user){
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "flex";
        document.getElementById("userInfo").innerHTML = `SESIÓN: ${user.toUpperCase()}`;
        if(admins.includes(user)) document.getElementById("panelBtn").style.display = "inline-block";
        cargarInventario();
    }
};

// CARGAR DATOS DESDE SHEETS
function cargarInventario() {
    const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
    fetch(url).then(r => r.json()).then(data => {
        inventario = data.map(p => {
            let item = {};
            Object.keys(p).forEach(key => item[key.toLowerCase().trim()] = p[key]);
            return {
                id: item.id,
                producto: item.producto,
                categoria: (item.categoria || "").toUpperCase(),
                talla: item.talla,
                color: item.color,
                stock: parseInt(item.stock) || 0,
                unidad: parseFloat(item["p.unidad"]) || 0,
                docena: parseFloat(item["p.docena"]) || 0,
                imagen: item.imagen
            };
        });
    }).catch(() => showToast("Error al cargar inventario", "error"));
}

// NAVEGACIÓN
function abrir(cat) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "grid";
    document.getElementById("carrito").style.display = "none";
    const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
    const unicos = {};
    filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });
    
    let html = "";
    Object.values(unicos).forEach(p => {
        html += `<div class="card" onclick="verProducto('${p.id}')">
            <img src="${p.imagen}">
            <h3>${p.producto}</h3>
            <p style="color:#00ff88; margin-bottom:10px;">S/ ${p.unidad.toFixed(2)}</p>
        </div>`;
    });
    document.getElementById("productos").innerHTML = html + `<button onclick="inicio()" style="grid-column: span 2; background:#333; color:white; border:none; padding:12px; border-radius:10px; margin-top:10px;">⬅ VOLVER</button>`;
}

function inicio() {
    document.getElementById("menu").style.display = "grid";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito").style.display = "none";
    document.getElementById("panel").style.display = "none";
}

// DETALLE Y SELECCIÓN
function verProducto(id) {
    const variantes = inventario.filter(v => v.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];
    
    document.getElementById("productos").innerHTML = `
        <div class="detalle-container">
            <img src="${p.imagen}" style="width:100%; border-radius:15px; height:200px; object-fit:cover;">
            <h2 style="margin:15px 0 5px 0;">${p.producto}</h2>
            <p style="color:gray; font-size:12px; margin-bottom:15px;">Selecciona las opciones para añadir</p>
            
            <div class="fila-opciones">
                <div><small>TALLA</small><select id="selTalla" onchange="actualizarColores('${id}')">${tallas.map(t => `<option value="${t}">${t}</option>`).join("")}</select></div>
                <div><small>COLOR</small><select id="selColor"></select></div>
            </div>

            <button class="btn-add" onclick="addDesdeBoton('${id}')">AÑADIR AL CARRITO</button>
            
            <table id="tablaDetalle"></table>
            <button onclick="abrir('${p.categoria}')" style="background:none; color:gray; border:none; width:100%; margin-top:20px;">⬅ Volver a la lista</button>
        </div>`;
    actualizarColores(id);
}

function actualizarColores(id) {
    const talla = document.getElementById("selTalla").value;
    const colores = inventario.filter(v => v.id == id && v.talla == talla);
    document.getElementById("selColor").innerHTML = colores.map(c => `<option value="${c.color}">${c.color} (Stock: ${c.stock})</option>`).join("");
    
    let filas = `<tr><th>COLOR</th><th>STOCK</th><th>P. UNID</th></tr>`;
    colores.forEach(v => { filas += `<tr><td>${v.color}</td><td>${v.stock}</td><td>S/ ${v.unidad.toFixed(2)}</td></tr>`; });
    document.getElementById("tablaDetalle").innerHTML = filas;
}

function addDesdeBoton(id) {
    const talla = document.getElementById("selTalla").value;
    const color = document.getElementById("selColor").value;
    const item = inventario.find(p => p.id == id && p.talla == talla && p.color == color);
    
    if(!item || item.stock <= 0) return showToast("Sin stock disponible", "error");

    const existe = carrito.find(c => c.id == id && c.talla == talla && c.color == color);
    if(existe) {
        if(existe.cantidad >= item.stock) return showToast("Límite de stock alcanzado", "error");
        existe.cantidad++;
    } else {
        carrito.push({ ...item, cantidad: 1 });
    }
    
    showToast(`Se añadió: ${item.producto}`);
    actualizarContador();
}

function actualizarContador() {
    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    document.getElementById("btnVerCarrito").innerText = `🛒 Carrito (${total})`;
}

// CARRITO LÓGICA
function verCarrito() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito").style.display = "block";
    renderCarrito();
}

function renderCarrito() {
    const contenedor = document.getElementById("lista-carrito");
    let html = "", total = 0;

    carrito.forEach((item, index) => {
        const precio = item.cantidad >= 12 ? item.docena : item.unidad;
        const subtotal = precio * item.cantidad;
        total += subtotal;

        html += `
        <div class="item-carrito">
            <div class="info-principal">
                <span>${item.producto}</span>
                <button class="btn-eliminar" onclick="eliminarItem(${index})">✕</button>
            </div>
            <div class="grid-carrito">
                <span>${item.talla} / ${item.color}</span>
                <div class="controles-cant">
                    <button class="btn-cant" onclick="cambiarCant(${index},-1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-cant" onclick="cambiarCant(${index},1)">+</button>
                </div>
                <span style="font-weight:bold;">S/ ${subtotal.toFixed(2)}</span>
            </div>
            <div style="font-size:10px; color:${item.cantidad >= 12 ? '#00ff88' : '#777'}; margin-top:5px;">
                ${item.cantidad >= 12 ? '★ Precio Docena Aplicado' : 'Precio Unitario'}
            </div>
        </div>`;
    });

    contenedor.innerHTML = html || `<p style="text-align:center; color:gray; padding:40px;">El carrito está vacío</p>`;
    document.getElementById("precioTotalCarrito").innerText = `S/ ${(total - descuentoGlobal).toFixed(2)}`;
}

function cambiarCant(index, val) {
    const item = carrito[index];
    const original = inventario.find(p => p.id == item.id && p.talla == item.talla && p.color == item.color);
    
    if(val > 0 && item.cantidad >= original.stock) return showToast("No hay más stock", "error");
    
    item.cantidad += val;
    if(item.cantidad <= 0) return eliminarItem(index);
    renderCarrito();
    actualizarContador();
}

function eliminarItem(index) {
    showToast(`Eliminado: ${carrito[index].producto}`, "error");
    carrito.splice(index, 1);
    renderCarrito();
    actualizarContador();
}

function aplicarDescuento() {
    descuentoGlobal = parseFloat(document.getElementById("montoDescuento").value) || 0;
    showToast("Descuento actualizado");
    renderCarrito();
}

function pagar() {
    if(carrito.length === 0) return showToast("Añade productos primero", "error");
    alert("¡Pedido realizado con éxito!");
    carrito = [];
    descuentoGlobal = 0;
    actualizarContador();
    inicio();
}

// ADMIN
function abrirPanel() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("panel").style.display = "block";
}
function abrirFormulario() { window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
