const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];

// NOTIFICACIONES (TOASTS)
function showToast(msg, type) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-trash'}"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// LOGIN & SESIÓN
function guardarUsuario(){
  const user = document.getElementById("usuario").value.toLowerCase();
  const pass = document.getElementById("password").value;
  if(usuariosSistema[user] === pass){
    localStorage.setItem("usuario", user);
    location.reload();
  } else {
    document.getElementById("errorLogin").innerText = "❌ Credenciales Inválidas";
  }
}

function cerrarSesion(){ localStorage.removeItem("usuario"); location.reload(); }

window.onload = () => {
  const user = localStorage.getItem("usuario");
  if(user){
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("userInfo").innerHTML = `<i class="fas fa-user-circle"></i> ${user.toUpperCase()}`;
    if(admins.includes(user)) document.getElementById("panelBtn").style.display = "block";
    cargarDatos();
  }
};

function cargarDatos() {
  const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
  fetch(url).then(r => r.json()).then(data => {
    inventario = data.map(p => ({
      id: p.ID, producto: p.PRODUCTO, categoria: p.CATEGORIA.toUpperCase(),
      talla: p.TALLA, color: p.COLOR, stock: parseInt(p.STOCK) || 0,
      unidad: parseFloat(p["P.UNIDAD"]), docena: parseFloat(p["P.DOCENA"]), imagen: p.IMAGEN
    }));
  });
}

// NAVEGACIÓN
function inicio(){
  document.getElementById("menu").style.display = "grid";
  document.getElementById("productos").style.display = "none";
  document.getElementById("seccion-carrito").style.display = "none";
  document.getElementById("panel").style.display = "none";
  document.getElementById("portada").style.display = "block";
}

function abrir(cat){
  document.getElementById("menu").style.display = "none";
  document.getElementById("portada").style.display = "none";
  const container = document.getElementById("productos");
  container.style.display = "grid";
  
  const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
  const unicos = [...new Map(filtrados.map(item => [item.id, item])).values()];

  container.innerHTML = unicos.map(p => `
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${p.imagen}">
      <h3>${p.producto}</h3>
      <p class="card-price">S/ ${p.unidad.toFixed(2)}</p>
    </div>
  `).join("") + `<button class="btn-pro btn-back" onclick="inicio()" style="grid-column:span 2">⬅ VOLVER</button>`;
}

function verProducto(id){
  const variantes = inventario.filter(v => v.id == id);
  const p = variantes[0];
  const tallas = [...new Set(variantes.map(v => v.talla))];

  document.getElementById("productos").innerHTML = `
    <div style="grid-column: span 2; background: #1a1a1a; padding: 15px; border-radius: 25px;">
      <img src="${p.imagen}" style="width:100%; border-radius:15px; height:250px; object-fit:cover;">
      <h2 style="margin: 15px 0 5px;">${p.producto}</h2>
      <p style="color:#888; font-size:12px; margin-bottom:15px;">Selecciona tus variantes preferidas abajo</p>
      
      <div class="fila-opciones" style="background:#222;">
        <div>TALLA <br> <select id="selTalla" onchange="actualizarColores('${id}')">${tallas.map(t=>`<option value="${t}">${t}</option>`).join("")}</select></div>
        <div>COLOR <br> <select id="selColor" onchange="actualizarStockUI('${id}')"></select></div>
      </div>
      
      <div class="fila-opciones" style="border: 1px solid #333;">
        <div>STOCK: <span id="stockCant" class="stock">0</span></div>
        <div>CÓDIGO: <span style="color:gray;">#${p.id}</span></div>
      </div>

      <button class="btn-pro btn-check" onclick="agregarAlCarrito('${id}')">🛒 AÑADIR AL CARRITO</button>
      
      <table id="tablaVariantes"></table>
      
      <button class="btn-pro btn-back" onclick="abrir('${p.categoria}')">⬅ VOLVER ATRÁS</button>
    </div>
  `;
  actualizarColores(id);
}

function actualizarColores(id){
  const talla = document.getElementById("selTalla").value;
  const filtrados = inventario.filter(v => v.id == id && v.talla == talla);
  document.getElementById("selColor").innerHTML = filtrados.map(v => `<option value="${v.color}">${v.color}</option>`).join("");
  
  document.getElementById("tablaVariantes").innerHTML = `<tr><th>COLOR</th><th>STOCK</th><th>PRECIO</th></tr>` + 
    filtrados.map(v => `<tr><td>${v.color}</td><td>${v.stock}</td><td>S/ ${v.unidad}</td></tr>`).join("");
  actualizarStockUI(id);
}

function actualizarStockUI(id){
  const t = document.getElementById("selTalla").value;
  const c = document.getElementById("selColor").value;
  const item = inventario.find(v => v.id == id && v.talla == t && v.color == c);
  document.getElementById("stockCant").innerText = item ? item.stock : 0;
}

// LÓGICA CARRITO + DESCUENTOS
function agregarAlCarrito(id){
  const t = document.getElementById("selTalla").value;
  const c = document.getElementById("selColor").value;
  const itemOriginal = inventario.find(v => v.id == id && v.talla == t && v.color == c);

  if(!itemOriginal || itemOriginal.stock <= 0) return alert("❌ Sin stock");

  const enCarrito = carrito.find(x => x.id == id && x.talla == t && x.color == c);
  
  if(enCarrito){
    if(enCarrito.cantidad >= itemOriginal.stock) return alert("Límite alcanzado");
    enCarrito.cantidad++;
  } else {
    carrito.push({...itemOriginal, cantidad: 1});
  }
  
  showToast("Producto añadido con éxito", "success");
  actualizarContador();
}

function actualizarContador(){
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  document.getElementById("cart-count").innerText = total;
}

function mostrarCarrito(){
  document.getElementById("menu").style.display = "none";
  document.getElementById("productos").style.display = "none";
  document.getElementById("portada").style.display = "none";
  document.getElementById("seccion-carrito").style.display = "block";
  renderizarCarrito();
}

function renderizarCarrito(){
  const lista = document.getElementById("lista-carrito");
  let html = "";
  let sumaTotal = 0;

  const conteoPorID = {};
  carrito.forEach(item => { conteoPorID[item.id] = (conteoPorID[item.id] || 0) + item.cantidad; });

  carrito.forEach((item, index) => {
    const totalID = conteoPorID[item.id];
    const esDocena = totalID >= 12;
    const precioUsado = esDocena ? item.docena : item.unidad;
    const subtotal = precioUsado * item.cantidad;
    sumaTotal += subtotal;

    html += `
      <div class="item-carrito">
        <div class="item-prod-info">
          <span class="item-prod-name">${item.producto}</span>
          <span class="item-prod-meta">${item.talla} | ${item.color} ${esDocena ? '<b style="color:#00ff88;">(Desc. Docena)</b>':''}</span>
        </div>
        <div style="display:flex; align-items:center; gap:5px;">
          <button class="btn-qty" onclick="cambiarCant(${index}, -1)">-</button>
          <b>${item.cantidad}</b>
          <button class="btn-qty" onclick="cambiarCant(${index}, 1)">+</button>
        </div>
        <div style="text-align:center;">S/ ${precioUsado.toFixed(2)}</div>
        <div style="text-align:right; font-weight:bold;">S/ ${subtotal.toFixed(2)}</div>
      </div>
    `;
  });

  lista.innerHTML = html || "<p style='text-align:center; padding:40px; color:#555;'>El carrito está vacío</p>";
  document.getElementById("totalCarrito").innerText = `S/ ${sumaTotal.toFixed(2)}`;
}

function cambiarCant(index, delta){
  const item = carrito[index];
  const original = inventario.find(v => v.id == item.id && v.talla == item.talla && v.color == item.color);
  
  if(delta > 0 && item.cantidad >= original.stock) return;
  
  item.cantidad += delta;
  if(item.cantidad <= 0) {
      carrito.splice(index, 1);
      showToast("Producto eliminado", "error");
  }
  
  renderizarCarrito();
  actualizarContador();
}

function finalizarPedido(){
  if(carrito.length === 0) return;
  alert("✅ Pedido generado. Se ha enviado al sistema.");
  carrito = [];
  actualizarContador();
  inicio();
}

function abrirPanel(){ 
  document.getElementById("menu").style.display = "none";
  document.getElementById("portada").style.display = "none";
  document.getElementById("panel").style.display = "block"; 
}
function abrirFormulario(){ window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas(){ window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
