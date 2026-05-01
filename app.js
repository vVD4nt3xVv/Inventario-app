let carrito = [];
let descuentoAplicado = 0;

// MENSAJES FLOTANTES
function showToast(msg, type) {
    const container = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = `toast ${type === 'success' ? 'toast-success' : 'toast-error'}`;
    t.innerText = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

// AÑADIR AL CARRITO
function agregarAlCarrito(id, talla, color, precio, producto) {
    const item = { id, talla, color, precio: parseFloat(precio), producto, cant: 1 };
    carrito.push(item);
    document.getElementById("cart-count").innerText = carrito.length;
    showToast("Se añadió al carrito", "success");
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    document.getElementById("cart-count").innerText = carrito.length;
    showToast("Se eliminó del carrito", "error");
    verCarrito();
}

// VISTA DETALLE PRODUCTO (Modificada con botón verde y espacios)
function verProducto(id){
    const variantes = inventario.filter(p=>p.id == id);
    const p = variantes[0];
    const tallas = [...new Set(variantes.map(v=>v.talla))];

    document.getElementById("main-content").innerHTML = `
        <div style="padding:10px;">
            <img class="detalle-img" src="${p.imagen}">
            <h2>${p.producto}</h2>
            <div class="fila-opciones">
                <div>🧵 TALLAS <select id="tallaSelect" onchange="cambiarTalla('${id}')">
                    ${tallas.map(t=>`<option value="${t}">${t}</option>`).join("")}
                </select></div>
                <div>📦 STOCK <span class="stock" id="stockTalla">0</span></div>
            </div>
            <table id="tablaDetalle"></table>
            
            <div class="footer-btns">
                <button class="btn-volver" onclick="volverLista('${p.categoria}')">Volver</button>
                <div></div> <!-- Espacio del medio -->
                <button class="btn-accion" onclick="prepararSeleccion('${id}')">Añadir</button>
            </div>
        </div>
    `;
    cambiarTalla(id);
}

// VISTA CARRITO
function verCarrito() {
    document.getElementById("main-content").style.display = "none";
    document.getElementById("carrito-view").style.display = "block";
    
    let html = `<table><tr><th>Prod</th><th>Talla</th><th>S/</th><th></th></tr>`;
    let subtotal = 0;
    
    carrito.forEach((item, i) => {
        subtotal += item.precio;
        html += `<tr>
            <td>${item.producto}</td><td>${item.talla}</td><td>${item.precio}</td>
            <td><button style="background:none; color:red; width:auto; margin:0;" onclick="quitarDelCarrito(${i})">X</button></td>
        </tr>`;
    });
    html += `</table>`;
    document.getElementById("lista-carrito").innerHTML = html;

    const total = subtotal - descuentoAplicado;
    document.getElementById("resumen-pago").innerHTML = `
        <div class="fila-pago"><span>Subtotal:</span><span>S/ ${subtotal.toFixed(2)}</span></div>
        <div class="fila-pago">
            <input type="number" id="descVal" placeholder="S/ Descuento" style="width:80px; background:#222; color:white; border:1px solid #444;">
            <button class="btn-descuento" onclick="aplicarDesc()">Aplicar</button>
        </div>
        <div class="fila-pago total-final"><span>TOTAL:</span><span>S/ ${total.toFixed(2)}</span></div>
        <div class="footer-btns">
            <button class="btn-volver" onclick="inicio()">Volver</button>
            <div></div>
            <button class="btn-accion" onclick="irAVoucher()">Pagar</button>
        </div>
    `;
}

function aplicarDesc() {
    descuentoAplicado = parseFloat(document.getElementById("descVal").value) || 0;
    verCarrito();
}

// VOUCHER Y PDF
function irAVoucher() {
    document.getElementById("carrito-view").style.display = "none";
    const v = document.getElementById("voucher-view");
    v.style.display = "block";
    
    let subtotal = carrito.reduce((a, b) => a + b.precio, 0);
    
    v.innerHTML = `
        <div class="factura">
            <h3 style="text-align:center; margin:0;">A&T KAMIARA S.A.C.</h3>
            <p style="text-align:center; font-size:10px; margin:2px;">RUC: 20XXXXXXXXX<br>AMPLIACION LOS LAURELES PAMPLONA ALTA SJM</p>
            <hr>
            <div id="items-voucher">
                ${carrito.map(i => `<div class="fila-pago"><span>${i.producto} (${i.talla})</span><span>S/ ${i.precio}</span></div>`).join("")}
            </div>
            <hr>
            <div class="fila-pago"><b>Total:</b> <b>S/ ${(subtotal - descuentoAplicado).toFixed(2)}</b></div>
        </div>
        <div class="footer-btns">
            <button class="btn-volver" onclick="verCarrito()">Volver</button>
            <div></div>
            <button class="btn-accion" onclick="confirmarPago()">Confirmar</button>
        </div>
    `;
}

async function confirmarPago() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("A&T KAMIARA S.A.C.", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text("RUC: 20XXXXXXXXX", 105, 26, { align: 'center' });
    doc.text("AMPLIACION LOS LAURELES PAMPLONA ALTA SJM", 105, 30, { align: 'center' });
    
    const body = carrito.map(i => [i.producto, i.talla, i.color, `S/ ${i.precio}`]);
    doc.autoTable({
        startY: 40,
        head: [['Producto', 'Talla', 'Color', 'Precio']],
        body: body,
    });
    
    let finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Descuento: S/ ${descuentoAplicado.toFixed(2)}`, 140, finalY);
    doc.setFontSize(14);
    doc.text(`TOTAL: S/ ${(carrito.reduce((a,b)=>a+b.precio,0) - descuentoAplicado).toFixed(2)}`, 140, finalY + 10);
    
    doc.save("Voucher_Kamiara.pdf");
    showToast("Pedido Confirmado y PDF generado", "success");
}
