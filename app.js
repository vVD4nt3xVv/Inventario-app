// ADVERTENCIA DE SEGURIDAD:
// Las credenciales estan hardcodeadas en el navegador (INSEGURO).
// TODO: Implementar autenticacion en backend (Node.js, Firebase, etc.)

// USUARIOS
const usuariosSistema = {
  luis:"123",
  katy:"123",
  katherine:"123",
  richard:"123",
  dante:"admin123"
};
const userProfiles = {
  luis: { nombre: "LUIS ANGEL ALATA", celular: "+51963963963" },
  katy: { nombre: "KATHERINE JAYO CANGRE", celular: "+51911122233" },
  katherine: { nombre: "KATHERINE APELLIDO", celular: "+51922233344" },
  richard: { nombre: "RICHARD APELLIDO", celular: "+51933344455" },
  dante: { nombre: "DANTE ADMINISTRADOR", celular: "+51922464915" }
};
const admins = ["dante"];

let inventario=[];
let CARRITO=[];
let currentDetailId=null;
let selectedVariantIndex=0;
let currentMode="venta";
let descuentoActual = 0;

function guardarUsuario(){
  const userInput = document.getElementById('usuario');
  const passInput = document.getElementById('password');
  const errorElement = document.getElementById('errorLogin');
  
  if(!userInput || !passInput || !errorElement) {
    console.error('Elementos del login no encontrados');
    return;
  }
  
  const user = (userInput.value || '').toLowerCase().trim();
  const pass = passInput.value || '';

  if(!user) return errorElement.innerText="Ingrese usuario";
  if(!pass) return errorElement.innerText="Ingrese contraseña";
  if(!usuariosSistema[user]) return errorElement.innerText="Usuario no registrado";
  if(usuariosSistema[user]!==pass) return errorElement.innerText="Contraseña incorrecta";

  localStorage.setItem("usuario",user);
  location.reload();
}

function cerrarSesion(){
  localStorage.removeItem("usuario");
  location.reload();
}

window.onload=()=>{
  try {
    const user = localStorage.getItem("usuario");
    const profile = userProfiles[user] || { nombre: user ? user.toUpperCase() : "INVITADO", celular: "+51922464915" };

    const loginEl = document.getElementById('login');
    const appEl = document.getElementById('app');
    
    if(loginEl) loginEl.style.display = user ? "none" : "flex";
    if(appEl) appEl.style.display = user ? "block" : "none";
    if(document.getElementById("footer-nav")) document.getElementById("footer-nav").style.display = "none";
    if(document.getElementById("detalle-view")) document.getElementById("detalle-view").style.display = "none";
    if(document.getElementById("carrito-view")) document.getElementById("carrito-view").style.display = "none";
    if(document.getElementById("voucher-view")) document.getElementById("voucher-view").style.display = "none";
    const btnBack = document.getElementById("btn-back");
    if(btnBack) btnBack.onclick = inicio;
    const btnNext = document.getElementById("btn-next");
    if(btnNext) btnNext.style.display = "none";

    if(user){
      const userName = document.getElementById("user-name");
      const userCell = document.getElementById("user-cell");
      const panelBtn = document.getElementById("panelBtn");
      
      if(userName) userName.innerText = profile.nombre;
      if(userCell) userCell.innerText = profile.celular;
      if(panelBtn) {
        if(admins.includes(user)){
          panelBtn.classList.add('visible');
        } else {
          panelBtn.classList.remove('visible');
        }
      }
      cargarInventario();
    }
  } catch(error) {
    console.error('Error en window.onload:', error);
    if(typeof showMessage === 'function') showMessage('Error inicializando aplicacion', 'error');
  }
};

const urlInv="https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";

async function cargarInventario(){
  try {
    const r = await fetch(urlInv);
    if(!r.ok) throw new Error(`Error: ${r.status}`);
    
    const d = await r.json();
    if(!Array.isArray(d) || d.length===0) {
      throw new Error('Datos inválidos del servidor');
    }
    
    inventario = d.map(p => {
      let o = {};
      Object.keys(p).forEach(k => o[k.toLowerCase().trim()] = p[k]);
      return {
        id: o.id,
        producto: o.producto,
        categoria: (o.categoria || "").toUpperCase(),
        talla: o.talla,
        color: o.color,
        stock: parseInt(o.stock) || 0,
        unidad: parseFloat(o["p.unidad"]) || 0,
        docena: parseFloat(o["p.docena"]) || 0,
        imagen: o.imagen
      };
    });
  } catch (error) {
    console.error('Error cargando inventario:', error);
    showMessage('Error cargando inventario. Intenta recargar.', 'error');
    inventario = [];
  }
}

function inicio(){
  menu.style.display="grid";
  productos.style.display="none";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  document.getElementById("footer-nav").style.display = "none";
}

function abrir(cat){
  menu.style.display="none";
  productos.style.display="grid";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  document.getElementById("footer-nav").style.display = "grid";
  document.getElementById("btn-back").onclick = inicio;
  document.getElementById("btn-back").innerText = "← Volver";
  document.getElementById("btn-next").style.display = "none";

  const filtrados = inventario.filter(p => p.categoria===cat && p.stock>0);
  const unicos = {};
  filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id]=p; });
  render(Object.values(unicos));
}

function render(lista){
  let html="";
  lista.forEach(p=>{
    const imgSrc = p.imagen ? `${p.imagen}&sz=200` : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3ESin Imagen%3C/text%3E%3C/svg%3E';
    html+=`
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${imgSrc}" alt="${p.producto}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect fill=%22%23333%22 width=%22150%22 height=%22150%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3E${p.producto}%3C/text%3E%3C/svg%3E'">
      <h3>${p.producto}</h3>
      <p style="color:lime;">S/ ${p.unidad}</p>
    </div>`;
  });
  productos.innerHTML=html;
}

function verProducto(id){
  currentDetailId = id;
  selectedVariantIndex = 0;
  document.getElementById("detalle-view").style.display = "block";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  menu.style.display = "none";
  productos.style.display = "none";
  document.getElementById("footer-nav").style.display = "grid";
  const producto = inventario.find(item => item.id == id);
  document.getElementById("btn-back").style.display = "inline-block";
  document.getElementById("btn-back").onclick = () => abrir(producto?.categoria || 'INVIERNO');
  document.getElementById("btn-back").innerText = "← Volver";
  document.getElementById("btn-next").style.display = "inline-block";
  document.getElementById("btn-next").onclick = () => agregarAlCarrito();
  document.getElementById("btn-next").innerText = "Añadir al carrito";
  renderDetalle();
}

function renderDetalle(){
  const todasVariantes = inventario.filter(p => p.id==currentDetailId && p.stock>0);
  if(!todasVariantes.length){
    inicio();
    return;
  }

  const producto = todasVariantes[0];
  const imgSrc = producto.imagen ? `${producto.imagen}&sz=300` : 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23333%22 width=%22300%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2220%22%3E${producto.producto}%3C/text%3E%3C/svg%3E';
  const tallas = [...new Set(todasVariantes.map(v => v.talla))];
  const tallaSeleccionada = document.getElementById("tallaSelect")?.value || "TODAS";
  const variantes = tallaSeleccionada === "TODAS" ? todasVariantes : todasVariantes.filter(v => v.talla === tallaSeleccionada);
  const stockTotal = todasVariantes.reduce((sum, item) => sum + item.stock, 0);
  const stockFiltrado = variantes.reduce((sum, item) => sum + item.stock, 0);

  const opcionesTalla = tallas.map(t => `<option value="${t}" ${t === tallaSeleccionada ? 'selected' : ''}>${t}</option>`).join("");
  const opciones = `
    ${opcionesTalla}
    <option value="TODAS" ${tallaSeleccionada === 'TODAS' ? 'selected' : ''}>TODAS</option>
  `;

  let filas = `
    <tr>
      <th>Seleccionar</th><th>TALLA</th><th>COLOR</th><th>STOCK</th><th>P.UNIDAD</th><th>P.DOCENA</th>
    </tr>
  `;

  variantes.forEach((v, index) => {
    const checked = index === selectedVariantIndex ? 'checked' : '';
    filas += `
      <tr>
        <td><input type="radio" name="variant" value="${index}" ${checked} onchange="seleccionarVariante(${index})"></td>
        <td>${v.talla}</td>
        <td>${v.color}</td>
        <td>${v.stock}</td>
        <td>S/ ${v.unidad}</td>
        <td>S/ ${v.docena}</td>
      </tr>
    `;
  });

  document.getElementById("detalle-content").innerHTML = `
    <div class="detalle-card">
      <img class="detalle-img" src="${producto.imagen || 'https://via.placeholder.com/300'}">
      <h2>${producto.producto}</h2>
      <div class="fila-opciones">
        <div>
          🧵 TALLAS
          <select id="tallaSelect" onchange="cambiarTalla()">
            ${opciones}
          </select>
        </div>
        <div>
          📦 STOCK
          <span class="stock" id="stockTalla">${stockFiltrado}</span>
        </div>
        <div>
          📊 TOTAL
          <span class="total">${stockTotal}</span>
        </div>
      </div>
      <table id="tablaDetalle">${filas}</table>
    </div>
  `;
}

function cambiarTalla(){
  selectedVariantIndex = 0;
  renderDetalle();
}

function seleccionarVariante(index){
  selectedVariantIndex = index;
  renderDetalle();
}

function agregarAlCarrito(){
  const todasVariantes = inventario.filter(p => p.id==currentDetailId && p.stock>0);
  if(!todasVariantes.length) return showMessage('No hay stock disponible', 'error');
  const tallaSeleccionada = document.getElementById("tallaSelect")?.value || "TODAS";
  const variantes = tallaSeleccionada === "TODAS" ? todasVariantes : todasVariantes.filter(v => v.talla === tallaSeleccionada);
  const variante = variantes[selectedVariantIndex] || variantes[0];
  if(!variante) return showMessage('Selecciona una variante', 'error');

  if(variante.stock < 1) return showMessage('No hay stock', 'error');

  const existente = CARRITO.find(item => item.id===variante.id && item.talla===variante.talla && item.color===variante.color);
  if(existente){
    existente.cant += 1;
  } else {
    CARRITO.push({ ...variante, cant: 1 });
  }

  variante.stock -= 1;
  if(variante.stock <= 0){
    selectedVariantIndex = 0;
  }

  document.getElementById("count").innerText = CARRITO.length;
  showMessage('Se añadió al carrito', 'success');
  renderDetalle();
}

function showMessage(text, type){
  let message = document.getElementById('app-message');
  if(!message){
    message = document.createElement('div');
    message.id = 'app-message';
    document.body.appendChild(message);
  }
  message.className = `notice ${type}`;
  message.innerText = text;
  message.style.display = 'inline-block';
  setTimeout(()=>{ message.style.display='none'; }, 2200);
}

function verCarrito(){
  document.getElementById("carrito-view").style.display = "block";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "none";
  menu.style.display = "none";
  productos.style.display = "none";
  document.getElementById("footer-nav").style.display = "none";
  renderCarrito();
}

function calcularPrecioItem(item){
  const precioUnitario = parseFloat(item.unidad) || 0;
  const precioDocena = parseFloat(item.docena) || 0;
  if(item.cant >= 12){
    return precioDocena * item.cant;
  }
  return precioUnitario * item.cant;
}

function calcularTotalesVenta(){
  let totalBruto = 0;
  CARRITO.forEach(item => {
    const precioUnit = item.cant >= 12 ? item.docena : item.unidad;
    totalBruto += precioUnit * item.cant;
  });
  
  const totalConDescuento = totalBruto - (descuentoActual || 0);
  const subtotal = Math.round((totalConDescuento / 1.18) * 100) / 100;
  const igv = Math.round((totalConDescuento - subtotal) * 100) / 100;
  
  return {
    totalBruto,
    totalConDescuento: Math.max(0, totalConDescuento),
    subtotal,
    igv,
    descuento: descuentoActual || 0
  };
}

function renderCarrito(){
  if(CARRITO.length===0){
    document.getElementById("cart-table").innerHTML = `<p style="text-align:center; color:#ccc;">El carrito está vacío.</p>`;
    return;
  }

  let rows = `<table><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th></th></tr>`;
  CARRITO.forEach((item, index) => {
    const sub = calcularPrecioItem(item);
    rows += `<tr>
      <td>${item.producto}<br><small>${item.talla} • ${item.color}</small></td>
      <td><button class="qty-btn" onclick="modificarCantidad(${index}, -1)">-</button> ${item.cant} <button class="qty-btn" onclick="modificarCantidad(${index}, 1)">+</button></td>
      <td>S/ ${sub.toFixed(2)}</td>
      <td><button class="remove-btn" onclick="eliminarItem(${index})">x</button></td>
    </tr>`;
  });
  rows += `</table>`;

  const subtotal = CARRITO.reduce((sum, item) => sum + calcularPrecioItem(item), 0);
  const descuento = descuentoActual || 0;
  const total = Math.max(0, subtotal - descuento);

  rows += `<div class="cart-summary">
      <div><span>Subtotal:</span><span style="text-align:right;">S/ ${subtotal.toFixed(2)}</span></div>
      <div class="discount-row">
        <span>Descuento:</span>
        <input id="cart-discount" type="number" placeholder="S/" value="${descuento}" oninput="actualizarDescuento(this.value)" style="width:60px;">
        <button class="btn-apply" onclick="aplicarDescuento()">Aplicar</button>
      </div>
      <div><strong>Total:</strong><strong style="text-align:right; display:block;">S/ ${total.toFixed(2)}</strong></div>
    </div>`;

  document.getElementById("cart-table").innerHTML = rows;
}

function modificarCantidad(index, cambio){
  const item = CARRITO[index];
  if(!item) return;
  if(cambio === 1){
    const original = inventario.find(prod => prod.id===item.id && prod.talla===item.talla && prod.color===item.color);
    if(original && original.stock > 0){
      item.cant += 1;
      original.stock -= 1;
    } else {
      return showMessage('No hay más stock disponible', 'error');
    }
  } else {
    item.cant -= 1;
    const original = inventario.find(prod => prod.id===item.id && prod.talla===item.talla && prod.color===item.color);
    if(original) original.stock += 1;
    if(item.cant <= 0){
      CARRITO.splice(index, 1);
    }
  }
  document.getElementById("count").innerText = CARRITO.length;
  renderCarrito();
}

function eliminarItem(index){
  const item = CARRITO[index];
  if(!item) return;
  const original = inventario.find(prod => prod.id===item.id && prod.talla===item.talla && prod.color===item.color);
  if(original) original.stock += item.cant;
  CARRITO.splice(index, 1);
  document.getElementById("count").innerText = CARRITO.length;
  showMessage('Se eliminó del carrito', 'error');
  renderCarrito();
}

function actualizarDescuento(value){
  descuentoActual = parseFloat(value) || 0;
}

function aplicarDescuento(){
  descuentoActual = parseFloat(document.getElementById('cart-discount')?.value) || 0;
  renderCarrito();
  showMessage('Descuento aplicado', 'success');
}

function pagar(tipo){
  if(CARRITO.length===0) return showMessage('El carrito está vacío', 'error');
  currentMode = tipo;
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "block";
  document.getElementById("detalle-view").style.display = "none";
  renderVoucher();
}

function renderVoucher(){
  const tipoTexto = currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA';
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario, celular: '+51922464915' };
  const numRef = generarReferencia(currentMode);
  const fecha = new Date();
  const fechaTexto = fecha.toLocaleDateString('es-PE') + ' ' + fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit' });

  const totales = calcularTotalesVenta();

  // Generar líneas de productos con alineación
  let productosHtml = '';
  productosHtml += `<div style="font-family: monospace; font-size: 11px; margin: 8px 0;">PRODUCTO              TALLA    COLOR    CANT    PRECIO</div>`;
  productosHtml += `<div style="font-family: monospace; font-size: 11px; color: #999;">──────────────────────────────────────────────────</div>`;
  
  CARRITO.forEach(item => {
    const precioUnit = item.cant >= 12 ? item.docena : item.unidad;
    const totalItem = precioUnit * item.cant;
    const nombreTrunc = item.producto.substring(0, 20).padEnd(20);
    const talla = (item.talla || '-').padEnd(8);
    const color = (item.color || '-').padEnd(8);
    const cantidad = String(item.cant).padEnd(4);
    const precio = `S/ ${totalItem.toFixed(2)}`.padStart(10);
    
    productosHtml += `<div style="font-family: monospace; font-size: 11px;">${nombreTrunc}${talla}${color}${cantidad}${precio}</div>`;
  });

  // Header del voucher con alineación
  let headerHtml = `<div style="font-family: monospace; font-size: 12px; text-align: center; font-weight: bold; margin-bottom: 8px;">A&T KAMIARA S.A.C.</div>`;
  
  const ruc = `RUC: 20XXXXXXXXXX`;
  const fechaLine = `Fecha: ${fechaTexto}`;
  const spacing = ' '.repeat(Math.max(0, 45 - ruc.length - fechaLine.length));
  headerHtml += `<div style="font-family: monospace; font-size: 11px;">${ruc}${spacing}${fechaLine}</div>`;
  headerHtml += `<div style="font-family: monospace; font-size: 11px; text-align: center; margin: 4px 0;">DIRECCION: AMPLIACIÓN LOS LAURELES PAMPLONA ALTA SJM</div>`;
  headerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999;">──────────────────────────────────────────────────</div>`;

  const tipoLine = tipoTexto;
  const codigoLine = `CODIGO: ${numRef}`;
  const tipoSpacing = ' '.repeat(Math.max(0, 50 - tipoLine.length - codigoLine.length));
  headerHtml += `<div style="font-family: monospace; font-size: 11px; font-weight: bold;">${tipoLine}${tipoSpacing}${codigoLine}</div>`;

  const vendedorLine = profile.nombre.substring(0, 30);
  const cellLine = `CELL: ${profile.celular}`;
  const vendSpacing = ' '.repeat(Math.max(0, 50 - vendedorLine.length - cellLine.length));
  headerHtml += `<div style="font-family: monospace; font-size: 11px;">${vendedorLine}${vendSpacing}${cellLine}</div>`;
  headerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999;">──────────────────────────────────────────────────</div>`;

  // Footer resumen
  let footerHtml = '';
  footerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999; margin-top: 8px;">──────────────────────────────────────────────────</div>`;
  
  const subtotalLabel = 'SUBTOTAL';
  const subtotalVal = `S/ ${totales.subtotal.toFixed(2)}`;
  const subtotalSpacing = ' '.repeat(Math.max(0, 45 - subtotalLabel.length - subtotalVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px;">${subtotalLabel}${subtotalSpacing}${subtotalVal}</div>`;

  const descLabel = 'DESCUENTO';
  const descVal = `S/ ${totales.descuento.toFixed(2)}`;
  const descSpacing = ' '.repeat(Math.max(0, 45 - descLabel.length - descVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px;">${descLabel}${descSpacing}${descVal}</div>`;

  const igvLabel = 'IGV 18%';
  const igvVal = `S/ ${totales.igv.toFixed(2)}`;
  const igvSpacing = ' '.repeat(Math.max(0, 45 - igvLabel.length - igvVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px;">${igvLabel}${igvSpacing}${igvVal}</div>`;

  footerHtml += `<div style="font-family: monospace; font-size: 11px; color: #999; margin-top: 4px;">──────────────────────────────────────────────────</div>`;

  const totalLabel = 'TOTAL';
  const totalVal = `S/ ${totales.totalConDescuento.toFixed(2)}`;
  const totalSpacing = ' '.repeat(Math.max(0, 45 - totalLabel.length - totalVal.length));
  footerHtml += `<div style="font-family: monospace; font-size: 11px; font-weight: bold;">${totalLabel}${totalSpacing}${totalVal}</div>`;

  footerHtml += `<div style="text-align: center; font-weight: bold; font-size: 11px; margin-top: 12px; font-family: monospace;">GRACIAS POR SU PREFERENCIA VUELVA PRONTO</div>`;

  document.getElementById("voucher-header").innerHTML = headerHtml;
  document.getElementById("voucher-body").innerHTML = `
    <div class="voucher-block">
      ${productosHtml}
      ${footerHtml}
    </div>
  `;
  document.querySelector('.voucher-footer .btn-confirm').innerText = currentMode==='proforma' ? 'Descargar PDF' : 'Descargar PDF';
}

function generarReferencia(tipo){
  const num = Math.floor(Math.random() * 900) + 100;
  return tipo === 'proforma' ? `PRF ${num}` : `VENT ${num}`;
}

function confirmarOperacion(){
  const tipoTexto = currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA';
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario, celular: '+51922464915' };
  const numRef = generarReferencia(currentMode);
  const fecha = new Date();
  const fechaTexto = fecha.toLocaleDateString('es-PE') + ' ' + fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit' });

  const totales = calcularTotalesVenta();

  const pdf = new jspdf.jsPDF();
  pdf.setFont('courier');
  let y = 15;

  // Header
  pdf.setFontSize(12);
  pdf.text('A&T KAMIARA S.A.C.', 105, y, { align: 'center' });
  y += 5;
  
  const ruc = `RUC: 20XXXXXXXXXX`;
  const fechaLine = `${fechaTexto}`;
  pdf.setFontSize(10);
  pdf.text(ruc, 10, y);
  pdf.text(fechaLine, 200, y, { align: 'right' });
  y += 5;

  pdf.text('DIRECCION: AMPLIACIÓN LOS LAURELES PAMPLONA ALTA SJM', 105, y, { align: 'center' });
  y += 5;

  pdf.text('─────────────────────────────────────────────────────', 105, y, { align: 'center' });
  y += 5;

  pdf.text(tipoTexto, 10, y);
  pdf.text(`CODIGO: ${numRef}`, 200, y, { align: 'right' });
  y += 5;

  pdf.text(profile.nombre.substring(0, 30), 10, y);
  pdf.text(`CELL: ${profile.celular}`, 200, y, { align: 'right' });
  y += 5;

  pdf.text('─────────────────────────────────────────────────────', 105, y, { align: 'center' });
  y += 6;

  // Encabezado productos
  pdf.setFontSize(9);
  pdf.text('PRODUCTO', 10, y);
  pdf.text('TALLA', 65, y);
  pdf.text('COLOR', 85, y);
  pdf.text('CANT', 110, y);
  pdf.text('PRECIO', 180, y, { align: 'right' });
  y += 4;

  pdf.text('─────────────────────────────────────────────────────', 105, y, { align: 'center' });
  y += 5;

  // Productos
  CARRITO.forEach(item => {
    const precioUnit = item.cant >= 12 ? item.docena : item.unidad;
    const totalItem = precioUnit * item.cant;
    const nombreTrunc = item.producto.substring(0, 15);
    
    pdf.text(nombreTrunc, 10, y);
    pdf.text(item.talla || '-', 65, y);
    pdf.text(item.color || '-', 85, y);
    pdf.text(String(item.cant), 110, y);
    pdf.text(`S/ ${totalItem.toFixed(2)}`, 180, y, { align: 'right' });
    y += 4;
  });

  pdf.text('─────────────────────────────────────────────────────', 105, y, { align: 'center' });
  y += 6;

  // Resumen
  pdf.setFontSize(10);
  pdf.text('SUBTOTAL', 10, y);
  pdf.text(`S/ ${totales.subtotal.toFixed(2)}`, 180, y, { align: 'right' });
  y += 5;

  pdf.text('DESCUENTO', 10, y);
  pdf.text(`S/ ${totales.descuento.toFixed(2)}`, 180, y, { align: 'right' });
  y += 5;

  pdf.text('IGV 18%', 10, y);
  pdf.text(`S/ ${totales.igv.toFixed(2)}`, 180, y, { align: 'right' });
  y += 5;

  pdf.text('─────────────────────────────────────────────────────', 105, y, { align: 'center' });
  y += 6;

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(11);
  pdf.text('TOTAL', 10, y);
  pdf.text(`S/ ${totales.totalConDescuento.toFixed(2)}`, 180, y, { align: 'right' });
  y += 8;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(9);
  pdf.text('GRACIAS POR SU PREFERENCIA VUELVA PRONTO', 105, y, { align: 'center' });

  pdf.save(`${tipoTexto.replace(' ', '_')}.pdf`);
  showMessage('PDF descargado. Ahora envía por WhatsApp.', 'success');
  
  // Mostrar ventana de WhatsApp
  setTimeout(() => {
    mostrarVentanaWhatsapp();
  }, 500);
}

function mostrarVentanaWhatsapp(){
  const tipoTexto = currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA';
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario, celular: '+51922464915' };
  const totales = calcularTotalesVenta();
  
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("whatsapp-view").style.display = "block";
  
  let previewHtml = `<div style="font-family: monospace; font-size: 11px; text-align: center;">`;
  previewHtml += `<strong>A&T KAMIARA S.A.C.</strong><br>`;
  previewHtml += `${tipoTexto}<br><br>`;
  previewHtml += `<strong>RESUMEN DE COMPRA</strong><br><br>`;
  
  CARRITO.forEach(item => {
    const precioUnit = item.cant >= 12 ? item.docena : item.unidad;
    const totalItem = precioUnit * item.cant;
    previewHtml += `${item.producto} (${item.talla}) x${item.cant}<br>`;
    previewHtml += `S/ ${totalItem.toFixed(2)}<br><br>`;
  });
  
  previewHtml += `SUBTOTAL: S/ ${totales.subtotal.toFixed(2)}<br>`;
  if(totales.descuento > 0) previewHtml += `DESCUENTO: -S/ ${totales.descuento.toFixed(2)}<br>`;
  previewHtml += `IGV 18%: S/ ${totales.igv.toFixed(2)}<br>`;
  previewHtml += `<strong>TOTAL: S/ ${totales.totalConDescuento.toFixed(2)}</strong><br><br>`;
  previewHtml += `Vendedor: ${profile.nombre}<br>`;
  previewHtml += `${profile.celular}`;
  previewHtml += `</div>`;
  
  document.getElementById("voucher-preview").innerHTML = previewHtml;
  document.getElementById("voucher-phone").value = '';
  document.getElementById("voucher-phone").focus();
}

function volverVoucher(){
  document.getElementById("whatsapp-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "block";
}

function enviarWhatsappVoucher(){
  const numeroCliente = document.getElementById('voucher-phone').value.replace(/\D/g,'');
  if(!numeroCliente || numeroCliente.length < 9) return showMessage('Ingrese un número válido', 'error');
  
  const numClienteFormato = numeroCliente.startsWith('51') ? numeroCliente : '51' + numeroCliente;
  const hiddenAdmin = '51922464915';
  const tipoTexto = currentMode === 'proforma' ? 'PROFORMA' : 'REGISTRO DE VENTA';
  const usuario = localStorage.getItem('usuario');
  const profile = userProfiles[usuario] || { nombre: usuario };
  const totales = calcularTotalesVenta();
  
  let msg = `*A&T KAMIARA - ${tipoTexto}*\n\n`;
  msg += `Vendedor: ${profile.nombre}\n\n`;
  msg += `*PRODUCTOS:*\n`;
  
  CARRITO.forEach(item => {
    const precioUnit = item.cant >= 12 ? item.docena : item.unidad;
    const totalItem = precioUnit * item.cant;
    msg += `• ${item.producto}\n`;
    msg += `  Talla: ${item.talla} | Color: ${item.color}\n`;
    msg += `  Cantidad: ${item.cant} | Precio: S/ ${totalItem.toFixed(2)}\n\n`;
  });
  
  msg += `*TOTALES:*\n`;
  msg += `Subtotal: S/ ${totales.subtotal.toFixed(2)}\n`;
  if(totales.descuento > 0) msg += `Descuento: S/ ${totales.descuento.toFixed(2)}\n`;
  msg += `IGV 18%: S/ ${totales.igv.toFixed(2)}\n`;
  msg += `*TOTAL: S/ ${totales.totalConDescuento.toFixed(2)}*`;
  
  window.open(`https://api.whatsapp.com/send?phone=${numClienteFormato}&text=${encodeURIComponent(msg)}`, '_blank');
  
  const msgAdmin = `Nuevo ${tipoTexto}: ${profile.nombre}\nCliente: +${numClienteFormato}\nTotal: S/ ${totales.totalConDescuento.toFixed(2)}`;
  window.open(`https://api.whatsapp.com/send?phone=${hiddenAdmin}&text=${encodeURIComponent(msgAdmin)}`, '_blank');
  
  showMessage('Abiertas las ventanas de WhatsApp', 'success');
  
  setTimeout(() => {
    CARRITO = [];
    descuentoActual = 0;
    currentMode = 'venta';
    document.getElementById("count").innerText = 0;
    document.getElementById("whatsapp-view").style.display = "none";
    inicio();
  }, 1000);
}

function volverDetalle(){
  if(currentDetailId) abrir(inventario.find(item=>item.id==currentDetailId)?.categoria || 'INVIERNO');
}

function volverCarrito(){
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "block";
}

function abrirPanel(){
  menu.style.display="none";
  productos.style.display="none";
  document.getElementById("detalle-view").style.display = "none";
  document.getElementById("carrito-view").style.display = "none";
  document.getElementById("voucher-view").style.display = "none";
  document.getElementById("panel").style.display = "block";
  document.getElementById("footer-nav").style.display = "none";
}

function abrirFormulario(){
  window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform");
}

function verVentas(){
  window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE");
}
