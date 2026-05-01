const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];
let descuentoTotal = 0;

// MENSAJES
function mostrarMensaje(texto, tipo) {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    div.className = `toast ${tipo}`;
    div.innerText = texto;
    container.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

// UI INICIAL
window.onload = () => {
    const user = localStorage.getItem("usuario");
    if(user) {
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("userInfo").innerHTML = `👤 ${user.toUpperCase()}`;
        // Solo el admin ve el botón
        if(admins.includes(user)) document.getElementById("panelBtn").style.display = "inline-block";
        cargarInventario();
    }
};

function guardarUsuario() {
    const u = usuario.value.toLowerCase();
    const p = password.value;
    if(usuariosSistema[u] === p) {
        localStorage.setItem("usuario", u);
        location.reload();
    } else {
        errorLogin.innerText = "Acceso Denegado";
    }
}

function cerrarSesion() {
    localStorage.removeItem("usuario");
    location.reload();
}

// PANEL EN OTRA VENTANA
function abrirPanelNuevaPestaña() {
    // Abrimos el panel actual como una URL simulada o el Google Sheets
    window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE", "_blank");
}

// CARGAR DATOS
async function cargarInventario() {
    const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
    try {
        const r = await fetch(url);
        const d = await r.json();
        inventario = d.map(p => {
            let o = {};
            Object.keys(p).forEach(k => o[k.toLowerCase().trim()] = p[k]);
            return {
                id: o.id, producto: o.producto, categoria: (o.categoria||"").toUpperCase(),
                talla: o.talla, color: o.color, stock: parseInt(o.stock)||0,
                unidad: parseFloat(o["p.unidad"]), docena: parseFloat(o["p.docena"]), imagen: o.imagen
            };
        });
    } catch(e) { mostrarMensaje("Error de conexión", "error"); }
}

// NAVEGACIÓN
function abrir(cat) {
    document.getElementById("main-content").style.display = "block";
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "grid";
    document.getElementById("carrito-view").style.display = "none";
    
    const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
    const unicos = {};
    filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });
    
    let html = "";
    Object.values(unicos).forEach(p => {
        html += `<div class="card" onclick="verProducto('${p.id}')">
            <img src="${p.imagen}">
            <h3>${p.producto}</h3>
            <p style="color:#00ff88;">S/ ${p.unidad}</p>
        </div>`;
    });
    document.getElementById("productos").innerHTML = html + `<div class="footer-btns"><button class="btn-rojo" onclick="inicio()">Volver</button></div>`;
}

function inicio() {
    document.getElementById("main-content").style.display = "block";
    document.getElementById("menu").style.display = "grid";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("voucher-view").style.display = "none";
}

// PRODUCTO Y CARRITO
function verProducto(id) {
    const variantes = inventario.filter(p => p.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];

    document.getElementById("productos").innerHTML = `
        <div style="grid-column: span 2;">
            <img src="${p.imagen}" style="width:100%; border-radius:15px; height:200px; object-fit:cover;">
            <h2 style="margin:10px 0;">${p.producto}</h2>
            <div style="background:#111; padding:10px; border-radius:10px; display:flex; justify-content:space-between;">
                <span>TALLA: <select id="selTalla" onchange="actualizarTabla('${id}')">${tallas.map(t=>`<option>${t}</option>`)}</select></span>
                <span id="stockTotal" style="color:cyan;"></span>
            </div>
            <table id="tablaVar"></table>
            <div class="footer-btns">
                <button class="btn-rojo" onclick="abrir('${p.categoria}')">Volver</button>
                <button class="btn-verde" onclick="agregarAlCarrito()">Añadir</button>
            </div>
        </div>
    `;
    actualizarTabla(id);
}

function actualizarTabla(id) {
    const t = document.getElementById("selTalla").value;
    const vars = inventario.filter(p => p.id == id && p.talla == t);
    let html = `<tr><th>Escoger</th><th>Color</th><th>Stock</th></tr>`;
    vars.forEach(v => {
        html += `<tr>
            <td><input type="checkbox" class="select-check" data-id="${inventario.indexOf(v)}"></td>
            <td>${v.color}</td><td>${v.stock}</td>
        </tr>`;
    });
    document.getElementById("tablaVar").innerHTML = html;
}

function agregarAlCarrito() {
    const checks = document.querySelectorAll(".select-check:checked");
    if(checks.length === 0) return mostrarMensaje("Selecciona un color", "error");
    
    checks.forEach(c => {
        const item = inventario[c.dataset.id];
        const existe = carrito.find(x => x.id_unico === c.dataset.id);
        if(existe) { existe.cant++; } 
        else { carrito.push({...item, cant: 1, id_unico: c.dataset.id}); }
    });
    
    document.getElementById("cart-count").innerText = carrito.length;
    mostrarMensaje("✅ Agregado", "success");
}

function verCarrito() {
    document.getElementById("main-content").style.display = "none";
    document.getElementById("carrito-view").style.display = "block";
    
    let subtotal = 0;
    let html = `<table><tr><th>Producto</th><th>Cant.</th><th>Sub.</th></tr>`;
    
    carrito.forEach((p, i) => {
        let sub = p.unidad * p.cant;
        subtotal += sub;
        html += `<tr>
            <td style="text-align:left;">${p.producto}<br><small>${p.talla}-${p.color}</small></td>
            <td>
                <div class="cant-control">
                    <button class="btn-qty" onclick="cambiarCant(${i},-1)">-</button>
                    ${p.cant}
                    <button class="btn-qty" onclick="cambiarCant(${i},1)">+</button>
                </div>
            </td>
            <td>S/ ${sub.toFixed(2)}</td>
        </tr>`;
    });
    
    document.getElementById("lista-carrito").innerHTML = html + `</table>`;
    
    const totalNeto = subtotal - descuentoTotal;
    document.getElementById("resumen-pago").innerHTML = `
        <div style="background:#1a1a1a; padding:15px; border-radius:10px; margin-top:10px;">
            <div class="desc-area">
                <button class="btn-qty" style="width:auto; padding:5px 10px; border-radius:5px;" onclick="aplicarD()">Aplicar</button>
                <input type="number" id="valDesc" placeholder="S/ Descuento" style="width:100px; text-align:right; background:#000; color:white; border:1px solid #444;">
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; color:#00aaff; font-size:1.1em;">
                <span>TOTAL:</span><span>S/ ${totalNeto.toFixed(2)}</span>
            </div>
            <div class="footer-btns">
                <button class="btn-rojo" onclick="inicio()">Volver</button>
                <button class="btn-verde" onclick="irAVoucher()">Pagar</button>
            </div>
        </div>
    `;
}

function cambiarCant(i, val) {
    carrito[i].cant += val;
    if(carrito[i].cant <= 0) carrito.splice(i, 1);
    document.getElementById("cart-count").innerText = carrito.length;
    verCarrito();
}

function aplicarD() {
    descuentoTotal = parseFloat(document.getElementById("valDesc").value) || 0;
    mostrarMensaje("Descuento aplicado", "success");
    verCarrito();
}

// VOUCHER E IGV
function irAVoucher() {
    if(carrito.length === 0) return mostrarMensaje("Carrito vacío", "error");
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("voucher-view").style.display = "block";
    
    const usuarioActual = localStorage.getItem("usuario") || "Sin nombre";
    const subTotalNeto = carrito.reduce((a,b)=> a + (b.unidad*b.cant), 0) - descuentoTotal;
    
    // Cálculo de IGV (Ejemplo: Total 100 -> IGV 18, Precio Base 82)
    const igv = subTotalNeto * 0.18;
    const base = subTotalNeto - igv;

    document.getElementById("voucher-view").innerHTML = `
        <div class="factura-box">
            <h3 style="text-align:center; margin:0;">A&T KAMIARA S.A.C.</h3>
            <p style="text-align:center; font-size:10px;">RUC: 20608451234<br>PAMPLONA ALTA SJM</p>
            <p style="font-size:11px;">Atendido por: <b>${usuarioActual.toUpperCase()}</b></p>
            <hr>
            ${carrito.map(p=>`<div style="display:flex; justify-content:space-between; font-size:11px;"><span>${p.producto} x${p.cant}</span><span>S/ ${(p.unidad*p.cant).toFixed(2)}</span></div>`).join("")}
            <hr>
            <div style="display:flex; justify-content:space-between; font-size:11px;"><span>Subtotal Base:</span><span>S/ ${base.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:11px;"><span>IGV (18%):</span><span>S/ ${igv.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1em; margin-top:5px;"><span>TOTAL FINAL:</span><span>S/ ${subTotalNeto.toFixed(2)}</span></div>
        </div>
        <div class="footer-btns">
            <button class="btn-rojo" onclick="verCarrito()">Volver</button>
            <button class="btn-verde" onclick="finalizarCompra()">Confirmar Pago</button>
        </div>
    `;
}

function finalizarCompra() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const usuarioActual = localStorage.getItem("usuario") || "Admin";
    const subTotalNeto = carrito.reduce((a,b)=> a + (b.unidad*b.cant), 0) - descuentoTotal;
    const igv = subTotalNeto * 0.18;
    const base = subTotalNeto - igv;

    doc.text("A&T KAMIARA S.A.C.", 105, 20, {align:'center'});
    doc.setFontSize(10);
    doc.text(`Atendido por: ${usuarioActual.toUpperCase()}`, 20, 30);
    
    const tabla = carrito.map(p => [p.producto, p.cant, `S/ ${p.unidad}`, `S/ ${(p.unidad*p.cant).toFixed(2)}`]);
    doc.autoTable({ startY: 35, head: [['Producto', 'Cant', 'Precio', 'Subtotal']], body: tabla });
    
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal Base: S/ ${base.toFixed(2)}`, 140, finalY);
    doc.text(`IGV (18%): S/ ${igv.toFixed(2)}`, 140, finalY + 5);
    doc.setFontSize(14);
    doc.text(`TOTAL: S/ ${subTotalNeto.toFixed(2)}`, 140, finalY + 15);
    
    doc.save("Voucher_Kamiara.pdf");
    mostrarMensaje("Venta procesada con éxito", "success");
    carrito = [];
    document.getElementById("cart-count").innerText = 0;
    inicio();
}
