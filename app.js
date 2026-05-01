const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [], carrito = [], descuentoGlobal = 0;

// NOTIFICACIONES
function showToast(msj, tipo = "success") {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    div.className = `toast ${tipo === "error" ? "error" : ""}`;
    div.innerText = msj;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// LOGIN
function guardarUsuario(){
    const user = document.getElementById("usuario").value.toLowerCase();
    const pass = document.getElementById("password").value;
    if(!usuariosSistema[user] || usuariosSistema[user] !== pass) return document.getElementById("errorLogin").innerText = "Credenciales incorrectas";
    localStorage.setItem("usuario", user);
    location.reload();
}
function cerrarSesion(){ localStorage.removeItem("usuario"); location.reload(); }

window.onload = () => {
    const user = localStorage.getItem("usuario");
    document.getElementById("login").style.display = user ? "none" : "flex";
    document.getElementById("app").style.display = user ? "block" : "none";
    if(user){
        document.getElementById("userInfo").innerHTML = `USUARIO: ${user.toUpperCase()}`;
        if(admins.includes(user)) document.getElementById("panelBtn").style.display = "inline-block";
    }
};

// DATOS
const urlInv = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
fetch(urlInv).then(r => r.json()).then(d => {
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

// NAVEGACIÓN
function abrir(cat) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "grid";
    document.getElementById("carrito").style.display = "none";
    const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
    const unicos = {};
    filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });
    renderLista(Object.values(unicos));
}

function inicio() {
    document.getElementById("menu").style.display = "grid";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito").style.display = "none";
    document.getElementById("panel").style.display = "none";
}

function renderLista(lista) {
    let html = "";
    lista.forEach(p => {
        html += `<div class="card" onclick="verProducto('${p.id}')"><img src="${p.imagen}"><h3>${p.producto}</h3><p style="color:lime;">S/ ${p.unidad}</p></div>`;
    });
    document.getElementById("productos").innerHTML = html + `<button onclick="inicio()" style="grid-column: span 2;">⬅ Volver al Menú</button>`;
}

// DETALLE PRODUCTO
function verProducto(id) {
    const variantes = inventario.filter(v => v.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];
    
    document.getElementById("productos").innerHTML = `
        <div style="grid-column: span 2; padding:10px; background:#111; border-radius:20px;">
            <img style="width:100%; border-radius:15px; height:250px; object-fit:cover;" src="${p.imagen}">
            <h2 style="margin:10px 0;">${p.producto}</h2>
            
            <div class="fila-opciones">
                <div>🧵 TALLA 
                    <select id="selTalla" onchange="actualizarColores('${id}')">
                        ${tallas.map(t => `<option value="${t}">${t}</option>`).join("")}
                    </select>
                </div>
                <div>🎨 COLOR 
                    <select id="selColor"></select>
                </div>
            </div>

            <button onclick="addDesdeBoton('${id}')" style="background:#28a745; font-weight:bold;">🛒 AÑADIR AL CARRITO</button>
            
            <h3 style="margin-top:20px;">Variantes Disponibles</h3>
            <table id="tablaDetalle"></table>
            <button onclick="abrir('${p.categoria}')" style="background:#444;">⬅ Volver a Lista</button>
        </div>`;
    actualizarColores(id);
}

function actualizarColores(id) {
    const talla = document.getElementById("selTalla").value;
    const colores = inventario.filter(v => v.id == id && v.talla == talla);
    document.getElementById("selColor").innerHTML = colores.map(c => `<option value="${c.color}">${c.color} (Stock: ${c.stock})</option>`).join("");
    
    let filas = `<tr><th>TALLA</th><th>COLOR</th><th>STOCK</th><th>UNID.</th><th>DOC.</th></tr>`;
    colores.forEach(v => {
        filas += `<tr><td>${v.talla}</td><td>${v.color}</td><td>${v.stock}</td><td>${v.unidad}</td><td>${v.docena}</td></tr>`;
    });
    document.getElementById("tablaDetalle").innerHTML = filas;
}

function addDesdeBoton(id) {
    const talla = document.getElementById("selTalla").value;
    const color = document.getElementById("selColor").value;
    agregarAlCarrito(id, talla, color);
}

// CARRITO
function agregarAlCarrito(id, talla, color) {
    const item = inventario.find(p => p.id == id && p.talla == talla && p.color == color);
    if(!item || item.stock <= 0) return showToast("Sin stock disponible", "error");

    const existe = carrito.find(c => c.id == id && c.talla == talla && c.color == color);
    if(existe) existe.cantidad++; else carrito.push({ ...item, cantidad: 1 });
    
    showToast(`Se añadió: ${item.producto} (${talla})`);
    renderCarrito();
}

function verCarrito() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito").style.display = "block";
    renderCarrito();
}

function renderCarrito() {
    const lista = document.getElementById("lista-carrito");
    let html = "", subtotal = 0, cantTotal = 0;

    carrito.forEach((item, index) => {
        const precio = item.cantidad >= 12 ? item.docena : item.unidad;
        const totalItem = precio * item.cantidad;
        subtotal += totalItem;
        cantTotal += item.cantidad;

        html += `
        <div class="item-carrito">
            <div class="info-principal"><span>${item.producto}</span> <button class="btn-eliminar" onclick="eliminarItem(${index})">X</button></div>
            <div class="grid-carrito">
                <span>T: ${item.talla}</span><span>C: ${item.color}</span>
                <div class="controles-cant">
                    <button class="btn-cant" onclick="cambiarCant(${index},-1)">-</button>
                    <span style="min-width:15px; text-align:center;">${item.cantidad}</span>
                    <button class="btn-cant" onclick="cambiarCant(${index},1)">+</button>
                </div>
                <span style="text-align:right; font-weight:bold;">S/ ${totalItem.toFixed(2)}</span>
            </div>
        </div>`;
    });

    lista.innerHTML = html || "<p style='text-align:center; color:gray;'>Tu carrito está vacío</p>";
    document.getElementById("btnVerCarrito").innerText = `🛒 Carrito (${cantTotal})`;
    document.getElementById("precioTotalCarrito").innerText = `S/ ${(subtotal - descuentoGlobal).toFixed(2)}`;
}

function cambiarCant(i, v) { 
    carrito[i].cantidad += v; 
    if(carrito[i].cantidad <= 0) return eliminarItem(i); 
    renderCarrito(); 
}

function eliminarItem(i) { 
    const nombre = carrito[i].producto;
    carrito.splice(i, 1); 
    showToast(`Se eliminó: ${nombre}`, "error");
    renderCarrito(); 
}

function aplicarDescuento() { 
    descuentoGlobal = parseFloat(document.getElementById("montoDescuento").value) || 0; 
    showToast("Descuento aplicado");
    renderCarrito(); 
}

function abrirPanel() { document.getElementById("menu").style.display="none"; document.getElementById("panel").style.display="block"; }
function abrirFormulario() { window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
function pagar() { 
    if(carrito.length === 0) return showToast("El carrito está vacío", "error");
    alert("¡Pedido generado! Gracias por su compra."); 
    carrito = []; 
    renderCarrito(); 
    inicio(); 
}
