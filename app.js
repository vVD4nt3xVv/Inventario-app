const CREDENCIALES = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const ADMINS = ["dante"];
let INVENTARIO = [], CARRITO = [];

// PERSISTENCIA DE SESIÓN AL CARGAR LA PÁGINA
window.onload = () => {
    const usuarioLogeado = localStorage.getItem("user");
    if (usuarioLogeado) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("user-display").innerText = "HOLA, " + usuarioLogeado.toUpperCase();
        if (ADMINS.includes(usuarioLogeado)) document.getElementById("adminBtn").style.display = "inline-block";
        inicializarBaseDeDatos();
    }
};

function login() {
    const u = document.getElementById("u").value.toLowerCase();
    const p = document.getElementById("p").value;
    if (CREDENCIALES[u] === p) {
        localStorage.setItem("user", u);
        location.reload(); // Recargar para iniciar el sistema
    } else {
        document.getElementById("err").innerText = "ACCESO DENEGADO";
    }
}

function salir() {
    localStorage.removeItem("user");
    location.reload();
}

async function inicializarBaseDeDatos() {
    const r = await fetch("https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO");
    const d = await r.json();
    INVENTARIO = d.map(p => {
        let n = {};
        Object.keys(p).forEach(k => n[k.toLowerCase().trim()] = p[k]);
        return {
            id: n.id, nombre: n.producto, cat: (n.categoria || "").toUpperCase(),
            talla: n.talla, color: n.color, stock: parseInt(n.stock) || 0,
            pUnit: parseFloat(n["p.unidad"]), pDoc: parseFloat(n["p.docena"]), img: n.imagen
        };
    });
    renderCategorias();
}

function renderCategorias() {
    const cats = ["INVIERNO", "VERANO", "TECNOLOGIA", "NAVIDEÑO"];
    const imgs = {
        INVIERNO: "https://lh3.googleusercontent.com/d/1ndTNY35U3vt6Pu5dFtgcLpNS9DqmMemK",
        VERANO: "https://lh3.googleusercontent.com/d/1-SOYaQM1NdW1UrNFCdLjuzb2l6eIvNOx",
        TECNOLOGIA: "https://lh3.googleusercontent.com/d/1EEwUFXk3iC6QvMtb29gh3ySLuQRK_aPq",
        NAVIDEÑO: "https://lh3.googleusercontent.com/d/1HnwTLL0kiuRe7AC_PusCq5UNvKDIlN6p"
    };
    let h = "";
    cats.forEach(c => h += `<div class="menu-card" onclick="irACategoria('${c}')"><img src="${imgs[c]}"><p>${c}</p></div>`);
    document.getElementById("menu-cats").innerHTML = h;
}

function irACategoria(c) {
    ocultarVistas();
    document.getElementById("v-productos").style.display = "block";
    document.getElementById("cat-nombre").innerText = c;
    const filtrados = INVENTARIO.filter(p => p.cat === c);
    const unicos = [...new Map(filtrados.map(item => [item['id'], item])).values()];
    let h = "";
    unicos.forEach(p => h += `<div class="product-card" onclick="verFichaProducto('${p.id}')"><img src="${p.img}"><h4>${p.nombre}</h4><p style="color:lime">S/ ${p.pUnit}</p></div>`);
    document.getElementById("lista-prods").innerHTML = h;
    setBotonesNav("volverInicio", "Inicio", null, "");
}

function verFichaProducto(id) {
    ocultarVistas();
    document.getElementById("v-detalle").style.display = "block";
    const variantes = INVENTARIO.filter(v => v.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];

    document.getElementById("st-total").innerText = "STOCK TOTAL: " + variantes.reduce((a, b) => a + b.stock, 0);

    let h = `
        <img src="${p.img}" style="width:100%; height:200px; object-fit:contain; border-radius:10px;">
        <h3>${p.nombre}</h3>
        <p>Seleccionar Talla: <select id="selectTalla" onchange="actualizarTablaVariantes('${id}')">${tallas.map(t => `<option>${t}</option>`).join("")}</select></p>
        <table>
            <tr style="background:#333;"><th>🛒</th><th>Color</th><th>Stock</th></tr>
            ${variantes.map(v => `<tr class="fila-variante" data-talla="${v.talla}">
                <td><input type="checkbox" class="check-item" data-idx="${INVENTARIO.indexOf(v)}"></td>
                <td>${v.color}</td><td>${v.stock}</td>
            </tr>`).join("")}
        </table>`;
    document.getElementById("detalle-content").innerHTML = h;
    actualizarTablaVariantes(id);
    setBotonesNav("irACategoria", p.cat, "agregarAlCarrito", "Añadir");
}

function actualizarTablaVariantes(id) {
    const tallaSeleccionada = document.getElementById("selectTalla").value;
    const stockTalla = INVENTARIO.filter(v => v.id == id && v.talla == tallaSeleccionada).reduce((a, b) => a + b.stock, 0);
    document.getElementById("st-talla").innerText = "POR TALLA: " + stockTalla;

    document.querySelectorAll(".fila-variante").forEach(fila => {
        fila.style.display = (fila.dataset.talla === tallaSeleccionada) ? "table-row" : "none";
    });
}

function agregarAlCarrito() {
    const marcados = document.querySelectorAll(".check-item:checked");
    marcados.forEach(m => {
        const item = INVENTARIO[m.dataset.idx];
        const ex = CARRITO.find(x => x.idx == m.dataset.idx);
        if (ex) ex.cant++; else CARRITO.push({ ...item, cant: 1, idx: m.dataset.idx });
        m.checked = false;
    });
    document.getElementById("count").innerText = CARRITO.length;
    const t = document.getElementById("toast"); t.style.display = "block"; setTimeout(() => t.style.display = "none", 2000);
}

function verCarrito() {
    ocultarVistas();
    document.getElementById("v-carrito").style.display = "block";
    let h = "<table>", total = 0;
    CARRITO.forEach((p, i) => {
        let precio = (p.cant >= 12) ? p.pDoc : p.pUnit;
        let sub = precio * p.cant; total += sub;
        h += `<tr><td>${p.nombre}<br>${p.talla}-${p.color}</td>
            <td><button onclick="edit(${i},-1)">-</button> ${p.cant} <button onclick="edit(${i},1)">+</button></td>
            <td>S/ ${sub.toFixed(2)}</td></tr>`;
    });
    document.getElementById("cart-list").innerHTML = h + "</table>";
    document.getElementById("cart-total").innerText = "TOTAL A PAGAR: S/ " + total.toFixed(2);
    setBotonesNav("volverInicio", "Inicio", "irAPago", "Pagar");
}

function edit(i, v) { CARRITO[i].cant += v; if (CARRITO[i].cant < 1) CARRITO.splice(i, 1); document.getElementById("count").innerText = CARRITO.length; verCarrito(); }

function irAPago() {
    if (CARRITO.length === 0) return alert("El carrito está vacío");
    ocultarVistas();
    document.getElementById("v-voucher").style.display = "block";
    const total = CARRITO.reduce((a, b) => a + ((b.cant >= 12 ? b.pDoc : b.pUnit) * b.cant), 0);
    document.getElementById("voucher-legal").innerHTML = `
        <div class="factura-box">
            <h3 style="text-align:center;">A&T KAMIARA S.A.C.</h3><hr>
            ${CARRITO.map(p => `<div style="display:flex; justify-content:space-between; font-size:11px;"><span>${p.nombre} x${p.cant}</span><span>S/ ${((p.cant >= 12 ? p.pDoc : p.pUnit) * p.cant).toFixed(2)}</span></div>`).join("")}
            <hr><div style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
        </div>`;
    setBotonesNav("verCarrito", "Volver", "confirmarVenta", "Confirmar");
}

function confirmarVenta() {
    const total = CARRITO.reduce((a, b) => a + ((b.cant >= 12 ? b.pDoc : b.pUnit) * b.cant), 0);
    const telCliente = document.getElementById("ws-phone").value;

    // Generar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 160] });
    doc.text("A&T KAMIARA", 10, 10);
    doc.text("TOTAL: S/ " + total.toFixed(2), 10, 20);
    doc.save("Voucher_Kamiara.pdf");

    // Envío a WhatsApp de Control Interno (+51922464915)
    const msgI = `*REGISTRO VENTA*\nVendedor: ${localStorage.getItem("user")}\nTotal: S/ ${total.toFixed(2)}`;
    window.open(`https://api.whatsapp.com/send?phone=51922464915&text=${encodeURIComponent(msgI)}`, '_blank');

    // Envío a WhatsApp Cliente
    if (telCliente) {
        setTimeout(() => {
            const msgC = `*A&T KAMIARA*\nHola, adjuntamos el detalle de su pedido por S/ ${total.toFixed(2)}`;
            window.open(`https://api.whatsapp.com/send?phone=51${telCliente}&text=${encodeURIComponent(msgC)}`, '_blank');
        }, 1200);
    }
    
    alert("Venta finalizada con éxito");
    CARRITO = []; location.reload();
}

function ocultarVistas() {
    ["v-inicio", "v-productos", "v-detalle", "v-carrito", "v-voucher"].forEach(v => document.getElementById(v).style.display = "none");
    document.getElementById("controles").style.display = "grid";
}

function volverInicio() {
    ocultarVistas();
    document.getElementById("v-inicio").style.display = "block";
    document.getElementById("controles").style.display = "none";
}

function setBotonesNav(fnB, txtB, fnN, txtN) {
    const b = document.getElementById("btn-back"), n = document.getElementById("btn-next");
    b.onclick = () => (fnB === "volverInicio") ? volverInicio() : window[fnB](txtB);
    b.innerText = "← " + txtB;
    if (fnN) { n.style.visibility = "visible"; n.onclick = () => window[fnN](); n.innerText = txtN; } 
    else { n.style.visibility = "hidden"; }
}

function abrirAdmin() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE", "_blank"); }
