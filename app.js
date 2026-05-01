// CONFIGURACIÓN INICIAL
const usuariosSistema = { luis:"123", katy:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];
let descuentoTotal = 0;

// SISTEMA DE MENSAJES (TOAST)
function mostrarMensaje(texto, tipo) {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    div.className = `toast ${tipo}`;
    div.innerText = texto;
    container.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

// LOGIN Y SESIÓN
window.onload = () => {
    const user = localStorage.getItem("usuario");
    if(user) {
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("userInfo").innerHTML = `USUARIO: ${user.toUpperCase()}`;
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
        errorLogin.innerText = "Error de credenciales";
    }
}

function cerrarSesion() {
    localStorage.removeItem("usuario");
    location.reload();
}

// CARGAR DATOS
async function cargarInventario() {
    const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
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
}

// NAVEGACIÓN
function abrir(cat) {
    document.getElementById("main-content").style.display = "block";
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "grid";
    
    const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
    const unicos = {};
    filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });
    
    let html = "";
    Object.values(unicos).forEach(p => {
        html += `<div class="card" onclick="verProducto('${p.id}')"><img src="${p.imagen}"><h3>${p.producto}</h3><p style="color:lime;">S/ ${p.unidad}</p></div>`;
    });
    document.getElementById("productos").innerHTML = html + `<button class="btn-rojo" onclick="inicio()">⬅ Volver</button>`;
}

function inicio() {
    document.getElementById("main-content").style.display = "block";
    document.getElementById("menu").style.display = "grid";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("voucher-view").style.display = "none";
    document.getElementById("panel").style.display = "none";
}

// DETALLE Y CARRITO
function verProducto(id) {
    const variantes = inventario.filter(p => p.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];

    document.getElementById("productos").innerHTML = `
        <div style="grid-column: span 2; text-align:left;">
            <img class="detalle-img" src="${p.imagen}" style="width:100%; border-radius:15px;">
            <h2>${p.producto}</h2>
            <div style="display:flex; justify-content:space-between; padding:10px; background:#111; border-radius:10px;">
                <span>🧵 TALLA: <select id="selTalla" onchange="actualizarTabla('${id}')">${tallas.map(t=>`<option>${t}</option>`)}</select></span>
                <span id="stockDinamico" style="color:#00ff88; font-weight:bold;">Stock: 0</span>
            </div>
            <table id="tablaVar"></table>
            <div class="footer-btns">
                <button class="btn-rojo" onclick="abrir('${p.categoria}')">Volver</button>
                <button class="btn-verde" onclick="agregarMultiple('${id}')">Añadir</button>
            </div>
        </div>
    `;
    actualizarTabla(id);
}

function actualizarTabla(id) {
    const t = document.getElementById("selTalla").value;
    const vars = inventario.filter(p => p.id == id && p.talla == t);
    let html = `<tr><th>Selecc.</th><th>Color</th><th>Stock</th><th>Precio</th></tr>`;
    vars.forEach((v, idx) => {
        html += `<tr>
            <td><input type="checkbox" class="select-check" data-idx="${inventario.indexOf(v)}"></td>
            <td>${v.color}</td><td>${v.stock}</td><td>S/ ${v.unidad}</td>
        </tr>`;
    });
    document.getElementById("tablaVar").innerHTML = html;
    document.getElementById("stockDinamico").innerText = "Stock: " + vars.reduce((a,b)=>a+b.stock,0);
}

function agregarMultiple(id) {
    const checks = document.querySelectorAll(".select-check:checked");
    if(checks.length === 0) return mostrarMensaje("Selecciona al menos uno", "error");
    
    checks.forEach(c => {
        const p = inventario[c.dataset.idx];
        carrito.push({...p, cant: 1});
    });
    
    document.getElementById("cart-count").innerText = carrito.length;
    mostrarMensaje("✅ Añadido al carrito", "success");
}

// VISTA CARRITO
function verCarrito() {
    document.getElementById("main-content").style.display = "none";
    document.getElementById("carrito-view").style.display = "block";
    
    let subtotal = 0;
    let html = `<table><tr><th>Producto</th><th>Talla/Color</th><th>Precio</th><th>X</th></tr>`;
    
    carrito.forEach((p, i) => {
        subtotal += p.unidad;
        html += `<tr>
            <td>${p.producto}</td><td>${p.talla} - ${p.color}</td><td>S/ ${p.unidad}</td>
            <td><button onclick="eliminarItem(${i})" style="background:none; color:red; border:none; font-weight:bold;">X</button></td>
        </tr>`;
    });
    
    document.getElementById("lista-carrito").innerHTML = html + `</table>`;
    
    const total = subtotal - descuentoTotal;
    document.getElementById("resumen-pago").innerHTML = `
        <div style="margin-top:20px; padding:15px; background:#1a1a1a; border-radius:10px;">
            <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; margin:10px 0;">
                <input type="number" id="valDesc" placeholder="Descuento S/" style="width:100px; background:#000; color:lime; border:1px solid #444;">
                <button class="btn-celeste" onclick="aplicarD()">Aplicar</button>
            </div>
            <div style="display:flex; justify-content:space-between; color:#00aaff; font-weight:bold; font-size:1.2em;">
                <span>TOTAL NETO:</span><span>S/ ${total.toFixed(2)}</span>
            </div>
            <div class="footer-btns">
                <button class="btn-rojo" onclick="inicio()">Volver</button>
                <button class="btn-verde" onclick="irAVoucher()">Pagar</button>
            </div>
        </div>
    `;
}

function eliminarItem(i) {
    carrito.splice(i, 1);
    mostrarMensaje("🗑 Eliminado del carrito", "error");
    document.getElementById("cart-count").innerText = carrito.length;
    verCarrito();
}

function aplicarD() {
    descuentoTotal = parseFloat(document.getElementById("valDesc").value) || 0;
    verCarrito();
}

// VOUCHER Y PDF
function irAVoucher() {
    if(carrito.length === 0) return mostrarMensaje("Carrito vacío", "error");
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("voucher-view").style.display = "block";
    
    const sub = carrito.reduce((a,b)=>a+b.unidad,0);
    const tot = sub - descuentoTotal;

    document.getElementById("voucher-view").innerHTML = `
        <div class="factura-box">
            <h3 style="text-align:center; margin-bottom:5px;">A&T KAMIARA S.A.C.</h3>
            <p style="text-align:center; font-size:10px; margin:0;">RUC: 20608451234 | SJM - LIMA</p>
            <p style="text-align:center; font-size:9px;">Dir: AMPLIACION LOS LAURELES PAMPLONA ALTA</p>
            <hr>
            ${carrito.map(p=>`<div style="display:flex; justify-content:space-between; font-size:11px;"><span>${p.producto} (${p.talla})</span><span>S/ ${p.unidad}</span></div>`).join("")}
            <hr>
            <div style="display:flex; justify-content:space-between;"><span>Descuento:</span><span>- S/ ${descuentoTotal.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1em;"><span>TOTAL:</span><span>S/ ${tot.toFixed(2)}</span></div>
        </div>
        <div class="footer-btns">
            <button class="btn-rojo" onclick="verCarrito()">Volver</button>
            <button class="btn-verde" onclick="descargarPDF()">Confirmar Pago</button>
        </div>
    `;
}

function descargarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16); doc.text("A&T KAMIARA S.A.C.", 105, 20, { align: 'center' });
    doc.setFontSize(10); doc.text("RUC: 20608451234 | PAMPLONA ALTA SJM", 105, 26, { align: 'center' });
    
    const tabla = carrito.map(p => [p.producto, p.talla, p.color, `S/ ${p.unidad}`]);
    doc.autoTable({
        startY: 35,
        head: [['Producto', 'Talla', 'Color', 'Subtotal']],
        body: tabla,
    });
    
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Descuento: S/ ${descuentoTotal.toFixed(2)}`, 140, finalY);
    doc.setFontSize(14);
    doc.text(`TOTAL FINAL: S/ ${(carrito.reduce((a,b)=>a+b.unidad,0) - descuentoTotal).toFixed(2)}`, 140, finalY + 10);
    
    doc.save("Voucher_Kamiara.pdf");
    mostrarMensaje("✅ PDF Descargado", "success");
}

// PANEL
function abrirPanel(){ menu.style.display="none"; panel.style.display="block"; }
function abrirFormulario(){ window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas(){ window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
