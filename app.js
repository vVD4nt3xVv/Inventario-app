// CONFIGURACIÓN DE USUARIOS
const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];
let descuentoTotal = 0;

// SISTEMA DE MENSAJES
function mostrarMensaje(texto, tipo) {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    div.className = `toast ${tipo}`;
    div.innerText = texto;
    container.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

// PANEL ADMIN INTERNO
function abrirPanelInterno() {
    document.getElementById("main-content").style.display = "none";
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("panel-admin-view").style.display = "block";
}

function abrirFormulario() { window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform", "_blank"); }
function verVentas() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE", "_blank"); }

// CARGA DE DATOS
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
            unidad: parseFloat(o["p.unidad"]), imagen: o.imagen
        };
    });
}

// RESET DE VISTA AL AÑADIR
function agregarAlCarrito(catPadre) {
    const checks = document.querySelectorAll(".select-check:checked");
    if(checks.length === 0) return mostrarMensaje("⚠️ Selecciona un color", "error");
    
    checks.forEach(c => {
        const item = inventario[c.dataset.id];
        const existe = carrito.find(x => x.id_unico === c.dataset.id);
        if(existe) { existe.cant++; } 
        else { carrito.push({...item, cant: 1, id_unico: c.dataset.id}); }
    });
    
    document.getElementById("cart-count").innerText = carrito.length;
    mostrarMensaje("✅ Agregado correctamente", "success");
    
    // AQUÍ SE RESTABLECE: Volvemos a la categoría para limpiar el selector
    abrir(catPadre); 
}

// VOUCHER CON DESCUENTO E IGV
function irAVoucher() {
    if(carrito.length === 0) return mostrarMensaje("Carrito vacío", "error");
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("voucher-view").style.display = "block";
    
    const usuarioActual = localStorage.getItem("usuario") || "Operador";
    const subTotalVenta = carrito.reduce((a,b)=> a + (b.unidad*b.cant), 0);
    const totalConDescuento = subTotalVenta - descuentoTotal;
    
    const igv = totalConDescuento * 0.18;
    const base = totalConDescuento - igv;

    document.getElementById("voucher-view").innerHTML = `
        <div class="factura-box">
            <h3 style="text-align:center; margin:0;">A&T KAMIARA S.A.C.</h3>
            <p style="text-align:center; font-size:10px;">RUC: 20608451234 | PAMPLONA ALTA SJM</p>
            <p style="font-size:11px;">Atendido por: <b>${usuarioActual.toUpperCase()}</b></p>
            <hr>
            ${carrito.map(p=>`<div style="display:flex; justify-content:space-between; font-size:11px;"><span>${p.producto} x${p.cant}</span><span>S/ ${(p.unidad*p.cant).toFixed(2)}</span></div>`).join("")}
            <hr>
            <div style="display:flex; justify-content:space-between; font-size:11px;"><span>Subtotal:</span><span>S/ ${subTotalVenta.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:11px; color:red;"><span>Descuento:</span><span>- S/ ${descuentoTotal.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:11px;"><span>Base Imponible:</span><span>S/ ${base.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-size:11px;"><span>IGV (18%):</span><span>S/ ${igv.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:1.1em; margin-top:5px; border-top:1px solid #000;">
                <span>TOTAL A PAGAR:</span><span>S/ ${totalConDescuento.toFixed(2)}</span>
            </div>
        </div>
        <div class="footer-btns">
            <button class="btn-rojo" onclick="verCarrito()">Volver</button>
            <button class="btn-verde" onclick="finalizarCompra()">Confirmar Pago</button>
        </div>
    `;
}

// Las funciones de Login, inicio() y verProducto() siguen la misma lógica ajustando los IDs del panel.
function inicio() {
    document.getElementById("main-content").style.display = "block";
    document.getElementById("menu").style.display = "grid";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("voucher-view").style.display = "none";
    document.getElementById("panel-admin-view").style.display = "none";
}

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
            </div>
            <table id="tablaVar"></table>
            <div class="footer-btns">
                <button class="btn-rojo" onclick="abrir('${p.categoria}')">Volver</button>
                <button class="btn-verde" onclick="agregarAlCarrito('${p.categoria}')">Añadir</button>
            </div>
        </div>
    `;
    actualizarTabla(id);
}
