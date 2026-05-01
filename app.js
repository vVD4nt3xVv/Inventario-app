const credenciales = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const adminUsers = ["dante"];
let inventario = [], carrito = [];

window.onload = () => {
    const sesion = localStorage.getItem("user");
    if(sesion) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("user-display").innerText = "HOLA, " + sesion.toUpperCase();
        if(adminUsers.includes(sesion)) document.getElementById("adminBtn").style.display = "inline-block";
        inicializarSistema();
    }
};

function login() {
    const u = document.getElementById("u").value.toLowerCase();
    const p = document.getElementById("p").value;
    if(credenciales[u] === p) {
        localStorage.setItem("user", u);
        location.reload();
    } else { document.getElementById("err").innerText = "ACCESO DENEGADO"; }
}

function salir() { localStorage.removeItem("user"); location.reload(); }

async function inicializarSistema() {
    const r = await fetch("https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO");
    const d = await r.json();
    inventario = d.map(p => {
        let n = {};
        Object.keys(p).forEach(k => n[k.toLowerCase().trim()] = p[k]);
        return {
            id: n.id, nombre: n.producto, cat: (n.categoria||"").toUpperCase(),
            talla: n.talla, color: n.color, stock: parseInt(n.stock)||0,
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
    const filtrados = inventario.filter(p => p.cat === c);
    const unicos = [...new Map(filtrados.map(item => [item['id'], item])).values()];
    let h = "";
    unicos.forEach(p => h += `<div class="product-card" onclick="verFicha('${p.id}')"><img src="${p.img}"><h4>${p.nombre}</h4><p style="color:lime">S/ ${p.pUnit}</p></div>`);
    document.getElementById("lista-prods").innerHTML = h;
    configNav("volverInicio", "Inicio", null, "");
}

function verFicha(id) {
    ocultarVistas();
    document.getElementById("v-detalle").style.display = "block";
    const variantes = inventario.filter(v => v.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v => v.talla))];
    
    document.getElementById("stock-total-div").innerText = "ST. TOTAL: " + variantes.reduce((a,b)=>a+b.stock,0);
    
    let h = `
        <img src="${p.img}" style="width:100%; border-radius:15px; height:220px; object-fit:contain; background:#000;">
        <h2 style="margin:10px 0;">${p.nombre}</h2>
        <p>TALLA: <select id="tallaSel" style="padding:5px; border-radius:5px;" onchange="updateStockTalla('${id}')">${tallas.map(t=>`<option>${t}</option>`).join("")}</select></p>
        <table style="width:100%; margin-top:10px;">
            <tr style="background:#333;"><th>Escoger</th><th>Color</th><th>Stock</th></tr>
            ${variantes.map(v => `<tr class="tr-var" data-talla="${v.talla}">
                <td><input type="checkbox" class="check-p" data-idx="${inventario.indexOf(v)}"></td>
                <td>${v.color}</td><td>${v.stock}</td>
            </tr>`).join("")}
        </table>`;
    document.getElementById("detalle-content").innerHTML = h;
    updateStockTalla(id);
    configNav("irACategoria", p.cat, "addAlCarrito", "Añadir");
}

function updateStockTalla(id) {
    const t = document.getElementById("tallaSel").value;
    const vars = inventario.filter(v => v.id == id && v.talla == t);
    document.getElementById("stock-talla-div").innerText = "ST. TALLA: " + vars.reduce((a,b)=>a+b.stock,0);
    
    document.querySelectorAll(".tr-var").forEach(tr => {
        tr.style.display = tr.dataset.talla === t ? "table-row" : "none";
    });
}

function addAlCarrito() {
    const checks = document.querySelectorAll(".check-p:checked");
    if(checks.length === 0) return alert("Selecciona una opción");
    checks.forEach(c => {
        const item = inventario[c.dataset.idx];
        const ex = carrito.find(x => x.idx == c.dataset.idx);
        if(ex) ex.cant++; else carrito.push({...item, cant: 1, idx: c.dataset.idx});
        c.checked = false;
    });
    document.getElementById("count").innerText = carrito.length;
    const ts = document.getElementById("toast"); ts.style.display = "block"; setTimeout(()=>ts.style.display="none", 2000);
}

function verCarrito() {
    ocultarVistas();
    document.getElementById("v-carrito").style.display = "block";
    let h = "<table style='width:100%;'>", total = 0;
    carrito.forEach((p, i) => {
        let precio = p.cant >= 12 ? p.pDoc : p.pUnit;
        let sub = precio * p.cant; total += sub;
        h += `<tr style='border-bottom:1px solid #333;'><td style='font-size:10px;'>${p.nombre}<br>${p.talla}-${p.color}</td>
            <td><button onclick='cambio(${i},-1)'>-</button> ${p.cant} <button onclick='cambio(${i},1)'>+</button></td>
            <td>S/ ${sub.toFixed(2)}</td></tr>`;
    });
    document.getElementById("cart-list").innerHTML = h + "</table>";
    document.getElementById("cart-total").innerText = "TOTAL A PAGAR: S/ " + total.toFixed(2);
    configNav("volverInicio", "Inicio", "preVoucher", "Pagar");
}

function cambio(i,v) { carrito[i].cant += v; if(carrito[i].cant<1) carrito.splice(i,1); document.getElementById("count").innerText = carrito.length; verCarrito(); }

function preVoucher() {
    if(carrito.length===0) return alert("Carrito vacío");
    ocultarVistas();
    document.getElementById("v-voucher").style.display = "block";
    const total = carrito.reduce((a,b)=>a+((b.cant>=12?b.pDoc:b.pUnit)*b.cant), 0);
    document.getElementById("voucher-legal").innerHTML = `
        <div class="factura-box">
            <h3 style="text-align:center;">A&T KAMIARA S.A.C.</h3>
            <p style="text-align:center; font-size:10px;">RUC: 20612345678<br>AV. PRINCIPAL 123 - LIMA</p><hr>
            ${carrito.map(p => `<div style="display:flex; justify-content:space-between; font-size:11px;"><span>${p.nombre} x${p.cant}</span><span>S/ ${((p.cant>=12?p.pDoc:p.pUnit)*p.cant).toFixed(2)}</span></div>`).join("")}
            <hr><div style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
        </div>`;
    configNav("verCarrito", "Volver", "confirmarVenta", "Confirmar");
}

function confirmarVenta() {
    const total = carrito.reduce((a,b)=>a+((b.cant>=12?b.pDoc:b.pUnit)*b.cant), 0);
    const tel = document.getElementById("ws-phone").value;
    
    // PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 160] });
    doc.text("A&T KAMIARA", 10, 10);
    let y = 20;
    carrito.forEach(p => { doc.text(`${p.nombre} x${p.cant}: S/ ${((p.cant>=12?p.pDoc:p.pUnit)*p.cant).toFixed(2)}`, 10, y); y += 7; });
    doc.text("TOTAL: S/ " + total.toFixed(2), 10, y + 5);
    doc.save("Recibo.pdf");

    // WhatsApp Registro Interno
    let msg = `*REGISTRO VENTA - A&T KAMIARA*\nVendedor: ${localStorage.getItem("user")}\nTotal: S/ ${total.toFixed(2)}`;
    window.open(`https://api.whatsapp.com/send?phone=51922464915&text=${encodeURIComponent(msg)}`, '_blank');

    // WhatsApp Cliente
    if(tel) {
        let msgC = `*A&T KAMIARA*\nHola, aquí tienes el resumen de tu compra por S/ ${total.toFixed(2)}`;
        setTimeout(()=> window.open(`https://api.whatsapp.com/send?phone=51${tel}&text=${encodeURIComponent(msgC)}`, '_blank'), 1000);
    }
    
    alert("Venta procesada con éxito");
    carrito = []; location.reload();
}

function ocultarVistas() {
    ["v-inicio", "v-productos", "v-detalle", "v-carrito", "v-voucher"].forEach(v => document.getElementById(v).style.display = "none");
    document.getElementById("controles").style.display = "grid";
}

function volverInicio() { ocultarVistas(); document.getElementById("v-inicio").style.display = "block"; document.getElementById("controles").style.display = "none"; }

function configNav(fnB, txtB, fnN, txtN) {
    const b = document.getElementById("btn-back"), n = document.getElementById("btn-next");
    b.onclick = () => { if(typeof window[fnB] === 'function') window[fnB](txtB); }; b.innerText = "← " + txtB;
    if(fnN) { n.style.visibility = "visible"; n.onclick = () => window[fnN](); n.innerText = txtN; } else { n.style.visibility = "hidden"; }
}

function abrirAdmin() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE", "_blank"); }
</script>
