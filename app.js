const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
let inventario = [];
let carrito = [];

// Carga inicial y Login
window.onload = () => {
    if(localStorage.getItem("usuario")) {
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        cargarDatos();
    }
};

function guardarUsuario() {
    const u = document.getElementById("inputUsuario").value.toLowerCase();
    const p = document.getElementById("inputPassword").value;
    if(usuariosSistema[u] === p) {
        localStorage.setItem("usuario", u);
        location.reload();
    } else { document.getElementById("errorLogin").innerText = "Credenciales incorrectas"; }
}

async function cargarDatos() {
    const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
    const r = await fetch(url);
    const d = await r.json();
    inventario = d.map(p => {
        let o = {};
        Object.keys(p).forEach(k => o[k.toLowerCase().trim()] = p[k]);
        return {
            id: o.id, producto: o.producto, categoria: (o.categoria||"").toUpperCase(),
            talla: o.talla, color: o.color, stock: parseInt(o.stock)||0,
            pUnitario: parseFloat(o["p.unidad"]), pDocena: parseFloat(o["p.docena"]), imagen: o.imagen
        };
    });
    mostrarMenu();
}

function mostrarMenu() {
    const cats = ["INVIERNO", "VERANO", "TECNOLOGIA", "NAVIDEÑO"];
    let html = "";
    cats.forEach(c => {
        html += `<div style="background:#111; border-radius:15px; text-align:center; padding-bottom:10px;" onclick="verCategoria('${c}')">
                    <img src="https://lh3.googleusercontent.com/d/1ndTNY35U3vt6Pu5dFtgcLpNS9DqmMemK" style="width:100%; height:100px; object-fit:cover; border-radius:15px 15px 0 0;">
                    <p>${c}</p>
                 </div>`;
    });
    document.getElementById("menu").innerHTML = html;
}

function verCategoria(cat) {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos-vista").style.display = "block";
    const lista = inventario.filter(p => p.categoria === cat);
    const unicos = [...new Map(lista.map(item => [item['id'], item])).values()];

    let html = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">`;
    unicos.forEach(p => {
        html += `<div style="background:#111; padding:10px; border-radius:10px; text-align:center;" onclick="verDetalle('${p.id}')">
                    <img src="${p.imagen}" style="width:100%; height:120px; object-fit:cover;">
                    <h4>${p.producto}</h4>
                    <p style="color:lime">S/ ${p.pUnitario}</p>
                 </div>`;
    });
    html += `</div><div class="footer-btns"><button class="btn-izq" onclick="location.reload()">Volver</button></div>`;
    document.getElementById("productos-vista").innerHTML = html;
}

function verDetalle(id) {
    const variantes = inventario.filter(v => v.id == id);
    const p = variantes[0];
    const stockTotal = variantes.reduce((acc, v) => acc + v.stock, 0);

    let html = `
        <div style="text-align:center;">
            <img src="${p.imagen}" style="width:100%; border-radius:15px; max-height:250px; object-fit:contain;">
            <div style="background:#222; padding:5px; margin:10px 0; border-radius:5px;">STOCK TOTAL: ${stockTotal}</div>
            <h2>${p.producto}</h2>
            <table>
                <tr><th>Escoger</th><th>Talla</th><th>Color</th><th>Stock</th></tr>`;
    
    variantes.forEach(v => {
        html += `<tr>
            <td><input type="checkbox" class="select-check" data-idx="${inventario.indexOf(v)}"></td>
            <td>${v.talla}</td><td>${v.color}</td><td>${v.stock}</td>
        </tr>`;
    });

    html += `</table></div>
        <div class="footer-btns">
            <button class="btn-izq" onclick="verCategoria('${p.categoria}')">Volver</button>
            <button class="btn-der" onclick="agregarAlCarrito()">Añadir</button>
        </div>`;
    document.getElementById("productos-vista").innerHTML = html;
}

function agregarAlCarrito() {
    const checks = document.querySelectorAll(".select-check:checked");
    if(checks.length === 0) return alert("Selecciona una opción");
    
    checks.forEach(c => {
        const item = inventario[c.dataset.idx];
        const existe = carrito.find(x => x.idx === c.dataset.idx);
        if(existe) { existe.cant++; } else { carrito.push({...item, cant: 1, idx: c.dataset.idx}); }
        c.checked = false; // Quitar marca sin reiniciar vista
    });
    alert("¡Añadido!");
}

function verCarrito() {
    document.getElementById("main-content").style.display = "none";
    document.getElementById("productos-vista").style.display = "none";
    document.getElementById("carrito-vista").style.display = "block";

    let subtotal = 0;
    let html = `<h2>Mi Carrito</h2><table><tr><th>Prod/Talla</th><th>Cant</th><th>Sub</th><th>X</th></tr>`;
    
    carrito.forEach((p, i) => {
        // Lógica de precio por docena
        let precioAplicado = (p.cant >= 12) ? p.pDocena : p.pUnitario;
        let sub = precioAplicado * p.cant;
        subtotal += sub;

        html += `<tr>
            <td>${p.producto}<br><small>${p.talla} - ${p.color}</small></td>
            <td>${p.cant}</td>
            <td>S/ ${sub.toFixed(2)}</td>
            <td><button style="background:red; color:white; border:none; border-radius:50%;" onclick="eliminarDelCarrito(${i})">×</button></td>
        </tr>`;
    });

    html += `</table>
        <h3 style="text-align:right;">Total: S/ ${subtotal.toFixed(2)}</h3>
        <div class="footer-btns">
            <button class="btn-izq" onclick="location.reload()">Cerrar</button>
            <button class="btn-der" onclick="generarVoucher()">Pagar</button>
        </div>`;
    document.getElementById("carrito-vista").innerHTML = html;
}

function eliminarDelCarrito(i) {
    carrito.splice(i, 1);
    verCarrito();
}

function generarVoucher() {
    document.getElementById("carrito-vista").style.display = "none";
    document.getElementById("voucher-vista").style.display = "block";
    
    const user = localStorage.getItem("usuario").toUpperCase();
    const sub = carrito.reduce((a,b) => a + ((b.cant>=12?b.pDocena:b.pUnitario)*b.cant), 0);

    let html = `
        <div class="factura-box" id="ticket-pdf">
            <h2 style="text-align:center;">A&T KAMIARA S.A.C.</h2>
            <p style="text-align:center;">RUC: 20612345678<br>Av. Principal 123, Lima<br>Vendedor: ${user}</p>
            <hr>
            ${carrito.map(p => `
                <div style="display:flex; justify-content:space-between;">
                    <span>${p.producto} (${p.talla}) x${p.cant}</span>
                    <span>S/ ${((p.cant>=12?p.pDocena:p.pUnitario)*p.cant).toFixed(2)}</span>
                </div>`).join("")}
            <hr>
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>TOTAL A PAGAR:</span><span>S/ ${sub.toFixed(2)}</span>
            </div>
            <p style="text-align:center; margin-top:10px;">¡Gracias por su compra!</p>
        </div>
        <div class="footer-btns">
            <button class="btn-izq" onclick="verCarrito()">Volver</button>
            <button class="btn-der" onclick="descargarPDF()">Descargar PDF</button>
        </div>`;
    document.getElementById("voucher-vista").innerHTML = html;
}

function descargarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [80, 150] }); // Formato ticketera
    
    doc.text("A&T KAMIARA S.A.C.", 10, 10);
    doc.setFontSize(8);
    doc.text("RUC: 20612345678", 10, 15);
    doc.text("----------------------------------", 10, 20);
    
    let y = 25;
    carrito.forEach(p => {
        let precio = p.cant >= 12 ? p.pDocena : p.pUnitario;
        doc.text(`${p.producto.substring(0,20)} x${p.cant}`, 10, y);
        doc.text(`S/ ${(precio*p.cant).toFixed(2)}`, 60, y);
        y += 5;
    });

    doc.text("----------------------------------", 10, y + 5);
    doc.text(`TOTAL: S/ ${carrito.reduce((a,b)=>a+((b.cant>=12?b.pDocena:b.pUnitario)*b.cant),0).toFixed(2)}`, 10, y + 10);
    
    doc.save("Voucher_Kamiara.pdf");
    alert("Venta finalizada y PDF generado");
    location.reload();
}
