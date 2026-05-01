const users = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let db = [], cart = [];

function login() {
    const user = document.getElementById("u").value.toLowerCase();
    const pass = document.getElementById("p").value;
    if(users[user] === pass) {
        localStorage.setItem("user", user);
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        if(admins.includes(user)) document.getElementById("adminBtn").style.display = "block";
        init();
    } else { document.getElementById("err").innerText = "Error de acceso"; }
}

async function init() {
    const res = await fetch("https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO");
    const data = await res.json();
    db = data.map(p => {
        let n = {};
        Object.keys(p).forEach(k => n[k.toLowerCase().trim()] = p[k]);
        return {
            id: n.id, nombre: n.producto, cat: (n.categoria||"").toUpperCase(),
            talla: n.talla, color: n.color, stock: parseInt(n.stock)||0,
            p1: parseFloat(n["p.unidad"]), p12: parseFloat(n["p.docena"]), img: n.imagen
        };
    });
    renderCats();
}

function renderCats() {
    const cats = ["INVIERNO", "VERANO", "TECNOLOGIA", "NAVIDEÑO"];
    const imgs = {
        INVIERNO: "https://lh3.googleusercontent.com/d/1ndTNY35U3vt6Pu5dFtgcLpNS9DqmMemK",
        VERANO: "https://lh3.googleusercontent.com/d/1-SOYaQM1NdW1UrNFCdLjuzb2l6eIvNOx",
        TECNOLOGIA: "https://lh3.googleusercontent.com/d/1EEwUFXk3iC6QvMtb29gh3ySLuQRK_aPq",
        NAVIDEÑO: "https://lh3.googleusercontent.com/d/1HnwTLL0kiuRe7AC_PusCq5UNvKDIlN6p"
    };
    let h = "";
    cats.forEach(c => h += `<div class="menu-card" onclick="verCat('${c}')"><img src="${imgs[c]}"><p>${c}</p></div>`);
    document.getElementById("menu-cats").innerHTML = h;
}

function verCat(c) {
    hideAll();
    document.getElementById("v-productos").style.display = "block";
    document.getElementById("cat-nombre").innerText = c;
    const prods = db.filter(p => p.cat === c);
    const unicos = [...new Map(prods.map(item => [item['id'], item])).values()];
    let h = "";
    unicos.forEach(p => h += `<div class="product-card" onclick="verDetalle('${p.id}')"><img src="${p.img}"><h4>${p.nombre}</h4><p style="color:lime">S/ ${p.p1}</p></div>`);
    document.getElementById("lista-prods").innerHTML = h;
    setNav("volverInicio", "Inicio", null, "");
}

function verDetalle(id) {
    hideAll();
    document.getElementById("v-detalle").style.display = "block";
    const variants = db.filter(v => v.id == id);
    const p = variants[0];
    document.getElementById("detalle-content").innerHTML = `
        <img src="${p.img}" style="width:100%; border-radius:20px; height:200px; object-fit:contain;">
        <div style="background:var(--primary); color:black; padding:5px; text-align:center; font-weight:bold; margin-top:10px;">STOCK TOTAL: ${variants.reduce((a,b)=>a+b.stock,0)}</div>
        <h2>${p.nombre}</h2>
        <table>
            <tr><th>Escoger</th><th>Talla</th><th>Color</th><th>Stock</th></tr>
            ${variants.map(v => `<tr><td><input type="checkbox" class="sel-p" data-idx="${db.indexOf(v)}"></td><td>${v.talla}</td><td>${v.color}</td><td>${v.stock}</td></tr>`).join("")}
        </table>`;
    setNav("verCat", p.cat, "addCart", "Añadir");
}

function addCart() {
    const checks = document.querySelectorAll(".sel-p:checked");
    checks.forEach(c => {
        const item = db[c.dataset.idx];
        const exist = cart.find(x => x.idx == c.dataset.idx);
        if(exist) exist.cant++; else cart.push({...item, cant: 1, idx: c.dataset.idx});
        c.checked = false;
    });
    document.getElementById("count").innerText = cart.length;
    const t = document.getElementById("toast"); t.style.display = "block"; setTimeout(()=>t.style.display="none", 2000);
}

function verCarrito() {
    hideAll();
    document.getElementById("v-carrito").style.display = "block";
    let h = "<table><tr><th>Producto</th><th>Cant</th><th>Sub</th></tr>", total = 0;
    cart.forEach((p, i) => {
        let precio = p.cant >= 12 ? p.p12 : p.p1;
        let sub = precio * p.cant;
        total += sub;
        h += `<tr><td>${p.nombre}<br><small>${p.talla}-${p.color}</small></td><td>${p.cant}</td><td>S/ ${sub.toFixed(2)}</td></tr>`;
    });
    document.getElementById("cart-list").innerHTML = h + "</table>";
    document.getElementById("cart-total").innerHTML = `TOTAL: S/ ${total.toFixed(2)}`;
    setNav("volverInicio", "Inicio", "irVoucher", "Pagar");
}

function irVoucher() {
    hideAll();
    document.getElementById("v-voucher").style.display = "block";
    const total = cart.reduce((a,b) => a + ((b.cant>=12?b.p12:b.p1)*b.cant), 0);
    document.getElementById("voucher-legal").innerHTML = `
        <div class="factura-box" id="ticket">
            <h3 style="text-align:center;">A&T KAMIARA S.A.C.</h3>
            <p style="text-align:center;">RUC: 20612345678<br>CALLE LAS EMPRESAS 123 - LIMA</p>
            <hr>
            ${cart.map(p => `<div style="display:flex; justify-content:space-between;"><span>${p.nombre} (x${p.cant})</span><span>S/ ${((p.cant>=12?p.p12:p.p1)*p.cant).toFixed(2)}</span></div>`).join("")}
            <hr><div style="display:flex; justify-content:space-between; font-weight:bold;"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
        </div>`;
    setNav("verCarrito", "Carrito", "procesarFinal", "Enviar");
}

function procesarFinal() {
    const t = cart.reduce((a,b) => a + ((b.cant>=12?b.p12:b.p1)*b.cant), 0);
    const phone = document.getElementById("ws-phone").value;
    
    // Generar PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] });
    doc.text("A&T KAMIARA S.A.C.", 10, 10);
    let y = 20;
    cart.forEach(p => {
        doc.text(`${p.nombre} x${p.cant} - S/ ${((p.cant>=12?p.p12:p.p1)*p.cant).toFixed(2)}`, 10, y);
        y += 7;
    });
    doc.text(`TOTAL: S/ ${t.toFixed(2)}`, 10, y + 5);
    doc.save("Voucher.pdf");

    // Enviar WhatsApp
    if(phone) {
        let msg = `*A&T KAMIARA S.A.C.*\nResumen de compra:\n`;
        cart.forEach(p => msg += `- ${p.nombre} (${p.talla}) x${p.cant}: S/ ${((p.cant>=12?p.p12:p.p1)*p.cant).toFixed(2)}\n`);
        msg += `\n*TOTAL A PAGAR: S/ ${t.toFixed(2)}*`;
        window.open(`https://api.whatsapp.com/send?phone=51${phone}&text=${encodeURIComponent(msg)}`, '_blank');
    }
    
    alert("¡Venta finalizada!");
    location.reload();
}

function hideAll() {
    ["v-inicio", "v-productos", "v-detalle", "v-carrito", "v-voucher"].forEach(v => document.getElementById(v).style.display = "none");
    document.getElementById("controles").style.display = "grid";
}

function volverInicio() { hideAll(); document.getElementById("v-inicio").style.display = "block"; document.getElementById("controles").style.display = "none"; }

function setNav(fnB, txtB, fnN, txtN) {
    const b = document.getElementById("btn-back"), n = document.getElementById("btn-next");
    b.onclick = () => window[fnB](); b.innerText = "← " + txtB;
    if(fnN) { n.style.visibility = "visible"; n.onclick = () => window[fnN](); n.innerText = txtN; } else { n.style.visibility = "hidden"; }
}

function abrirAdmin() { window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE", "_blank"); }
