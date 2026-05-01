const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];
let descuentoTotal = 0;

function mostrarMensaje(texto, tipo) {
    const container = document.getElementById("toast-container");
    const div = document.createElement("div");
    div.className = `toast ${tipo}`;
    div.innerText = texto;
    container.appendChild(div);
    setTimeout(() => div.remove(), 2500);
}

window.onload = () => {
    const user = localStorage.getItem("usuario");
    if(user) {
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("userInfo").innerHTML = `👤 ${user.toUpperCase()}`;
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
    } else { errorLogin.innerText = "Acceso denegado"; }
}

function cerrarSesion() { localStorage.removeItem("usuario"); location.reload(); }

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

function abrir(cat) {
    inicio();
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "grid";
    const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
    const unicos = {};
    filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });
    let html = "";
    Object.values(unicos).forEach(p => {
        html += `<div class="card" onclick="verProducto('${p.id}')"><img src="${p.imagen}"><h3>${p.producto}</h3><p style="color:lime">S/ ${p.unidad}</p></div>`;
    });
    document.getElementById("productos").innerHTML = html + `<div class="footer-btns"><button class="btn-rojo" onclick="inicio()">Volver</button></div>`;
}

function verProducto(id) {
    const variantes = inventario.filter(p => p.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];
    document.getElementById("productos").innerHTML = `
        <div style="grid-column: span 2;">
            <img src="${p.imagen}" style="width:100%; border-radius:15px; height:200px; object-fit:cover;">
            <h2>${p.producto}</h2>
            <span>TALLA: <select id="selTalla" onchange="actualizarTabla('${id}')">${tallas.map(t=>`<option>${t}</option>`)}</select></span>
            <table id="tablaVar"></table>
            <div class="footer-btns">
                <button class="btn-rojo" onclick="abrir('${p.categoria}')">Volver</button>
                <button class="btn-verde" onclick="agregarAlCarrito('${p.categoria}')">Añadir</button>
            </div>
        </div>`;
    actualizarTabla(id);
}

function actualizarTabla(id) {
    const t = document.getElementById("selTalla").value;
    const vars = inventario.filter(p => p.id == id && p.talla == t);
    let html = `<tr><th>Escoger</th><th>Color</th><th>Stock</th></tr>`;
    vars.forEach(v => {
        html += `<tr><td><input type="checkbox" class="select-check" data-id="${inventario.indexOf(v)}"></td><td>${v.color}</td><td>${v.stock}</td></tr>`;
    });
    document.getElementById("tablaVar").innerHTML = html;
}

function agregarAlCarrito(cat) {
    const checks = document.querySelectorAll(".select-check:checked");
    if(checks.length === 0) return mostrarMensaje("Selecciona un color", "error");
    checks.forEach(c => {
        const item = inventario[c.dataset.id];
        const existe = carrito.find(x => x.id_unico === c.dataset.id);
        if(existe) { existe.cant++; } else { carrito.push({...item, cant: 1, id_unico: c.dataset.id}); }
    });
    document.getElementById("cart-count").innerText = carrito.length;
    mostrarMensaje("✅ Añadido", "success");
    abrir(cat); // Reset del selector
}

function verCarrito() {
    document.getElementById("main-content").style.display = "none";
    document.getElementById("carrito-view").style.display = "block";
    let subtotal = 0;
    let html = `<table><tr><th>Producto</th><th>Cant.</th><th>Sub.</th></tr>`;
    carrito.forEach((p, i) => {
        let sub = p.unidad * p.cant; subtotal += sub;
        html += `<tr><td>${p.producto}<br><small>${p.talla}-${p.color}</small></td><td><div class="cant-control"><button class="btn-qty" onclick="cambiarCant(${i},-1)">-</button>${p.cant}<button class="btn-qty" onclick="cambiarCant(${i},1)">+</button></div></td><td>S/ ${sub.toFixed(2)}</td></tr>`;
    });
    document.getElementById("lista-carrito").innerHTML = html + `</table>`;
    const totalNeto = subtotal - descuentoTotal;
    document.getElementById("resumen-pago").innerHTML = `
        <div class="desc-area"><button class="btn-qty" style="width:auto; padding:5px 10px; border-radius:5px;" onclick="aplicarD()">Aplicar</button><input type="number" id="valDesc" placeholder="S/ Desc" style="width:80px; text-align:right;"></div>
        <div style="display:flex; justify-content:space-between; font-weight:bold; color:cyan;"><span>TOTAL:</span><span>S/ ${totalNeto.toFixed(2)}</span></div>
        <div class="footer-btns"><button class="btn-rojo" onclick="inicio()">Volver</button><button class="btn-verde" onclick="irAVoucher()">Pagar</button></div>`;
}

function cambiarCant(i, v) { carrito[i].cant += v; if(carrito[i].cant<=0) carrito.splice(i,1); document.getElementById("cart-count").innerText = carrito.length; verCarrito(); }
function aplicarD() { descuentoTotal = parseFloat(document.getElementById("valDesc").value)||0; verCarrito(); }

function irAVoucher() {
    document.getElementById("carrito-view").style.display = "none";
    document.getElementById("voucher-view").style.display = "block";
    const user = localStorage.getItem("usuario")||"Admin";
    const sub = carrito.reduce((a,b)=> a+(b.unidad*b.cant), 0);
    const total = sub - descuentoTotal;
    const igv = total * 0.18; const base = total - igv;
    document.getElementById("voucher-view").innerHTML = `
        <div class="factura-box">
            <h3 style="text-align:center;">A&T KAMIARA S.A.C.</h3>
            <p style="text-align:center; font-size:10px;">Atendido por: ${user.toUpperCase()}</p><hr>
            ${carrito.map(p=>`<div style="display:flex; justify-content:space-between;"><span>${p.producto} x${p.cant}</span><span>S/ ${(p.unidad*p.cant).toFixed(2)}</span></div>`).join("")}<hr>
            <div style="display:flex; justify-content:space-between;"><span>Subtotal:</span><span>S/ ${sub.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; color:red;"><span>Descuento:</span><span>- S/ ${descuentoTotal.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>Base Imponible:</span><span>S/ ${base.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>IGV (18%):</span><span>S/ ${igv.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; font-weight:bold; margin-top:5px; border-top:1px solid #000;"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
        </div>
        <div class="footer-btns"><button class="btn-rojo" onclick="verCarrito()">Volver</button><button class="btn-verde" onclick="finalizar()">Confirmar</button></div>`;
}

function abrirPanelInterno() { document.getElementById("main-content").style.display = "none"; document.getElementById("panel-admin-view").style.display = "block"; }
function abrirFormulario() { window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform", "_blank"); }
function verVentas() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE", "_blank"); }
function inicio() { document.getElementById("main-content").style.display="block"; document.getElementById("menu").style.display="grid"; document.getElementById("productos").style.display="none"; document.getElementById("carrito-view").style.display="none"; document.getElementById("voucher-view").style.display="none"; document.getElementById("panel-admin-view").style.display="none"; }
function finalizar() { mostrarMensaje("Venta procesada", "success"); carrito=[]; document.getElementById("cart-count").innerText=0; inicio(); }
