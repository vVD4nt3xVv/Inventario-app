const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];
let descuentoGlobal = 0;

// LOGIN
function guardarUsuario(){
    const user = document.getElementById("usuario").value.toLowerCase();
    const pass = document.getElementById("password").value;
    if(!usuariosSistema[user] || usuariosSistema[user] !== pass) {
        return document.getElementById("errorLogin").innerText = "Error de credenciales";
    }
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
    document.getElementById("productos").innerHTML = html + `<button onclick="inicio()">⬅ Volver</button>`;
}

// DETALLES Y TALLAS
function verProducto(id) {
    const variantes = inventario.filter(p => p.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];
    const stockTotal = variantes.reduce((a, b) => a + b.stock, 0);

    document.getElementById("productos").innerHTML = `
        <div style="padding:10px;">
            <img style="width:100%; border-radius:15px;" src="${p.imagen}">
            <h2>${p.producto}</h2>
            <div class="fila-opciones">
                <div>🧵 TALLA <select id="tallaSelect" onchange="cambiarTalla('${id}')">${tallas.map(t=>`<option value="${t}">${t}</option>`).join("")}<option value="TODAS">TODAS</option></select></div>
                <div>📦 STOCK <span class="stock" id="stockTalla">0</span></div>
                <div>📊 TOTAL <span class="total" style="color:#00aaff; font-weight:bold;">${stockTotal}</span></div>
            </div>
            <table id="tablaDetalle"></table>
            <button onclick="abrir('${p.categoria}')">⬅ Volver</button>
        </div>`;
    cambiarTalla(id);
}

function cambiarTalla(id) {
    const talla = document.getElementById("tallaSelect").value;
    const filtrados = talla === "TODAS" ? inventario.filter(p => p.id == id) : inventario.filter(p => p.id == id && p.talla == talla);
    document.getElementById("stockTalla").innerText = filtrados.reduce((a, b) => a + b.stock, 0);

    let filas = `<tr><th>TALLA</th><th>COLOR</th><th>STOCK</th><th>UNID.</th><th>DOC.</th><th>ADD</th></tr>`;
    filtrados.forEach(v => {
        filas += `<tr><td>${v.talla}</td><td>${v.color}</td><td>${v.stock}</td><td>${v.unidad}</td><td>${v.docena}</td>
        <td><button onclick="agregarAlCarrito('${v.id}','${v.talla}','${v.color}')" style="background:#28a745; width:auto; padding:5px; margin:0;">+</button></td></tr>`;
    });
    document.getElementById("tablaDetalle").innerHTML = filas;
}

// LÓGICA CARRITO
function agregarAlCarrito(id, talla, color) {
    const item = inventario.find(p => p.id == id && p.talla == talla && p.color == color);
    const existe = carrito.find(c => c.id == id && c.talla == talla && c.color == color);
    if(existe) existe.cantidad++; else carrito.push({ ...item, cantidad: 1 });
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
                <div class="controles-cant"><button class="btn-cant" onclick="cambiarCant(${index},-1)">-</button><span>${item.cantidad}</span><button class="btn-cant" onclick="cambiarCant(${index},1)">+</button></div>
                <span style="text-align:right">S/ ${totalItem.toFixed(2)}</span>
            </div>
            <small style="color:${item.cantidad >= 12 ? '#00ff88' : 'gray'}">${item.cantidad >= 12 ? '✓ Precio Docena' : 'Precio Unitario'}</small>
        </div>`;
    });

    lista.innerHTML = html || "<p style='text-align:center'>Vacío</p>";
    document.getElementById("btnVerCarrito").innerText = `🛒 Carrito (${cantTotal})`;
    document.getElementById("precioTotalCarrito").innerText = `S/ ${(subtotal - descuentoGlobal).toFixed(2)}`;
}

function cambiarCant(i, v) { carrito[i].cantidad += v; if(carrito[i].cantidad <= 0) eliminarItem(i); renderCarrito(); }
function eliminarItem(i) { carrito.splice(i, 1); renderCarrito(); }
function aplicarDescuento() { descuentoGlobal = parseFloat(document.getElementById("montoDescuento").value) || 0; renderCarrito(); }
function abrirPanel() { document.getElementById("menu").style.display="none"; document.getElementById("panel").style.display="block"; }
function abrirFormulario() { window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
function pagar() { alert("Pedido generado con éxito"); carrito = []; renderCarrito(); inicio(); }
