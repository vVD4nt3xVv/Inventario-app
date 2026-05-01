const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];

// SESIÓN
function guardarUsuario(){
  const user = document.getElementById("usuario").value.toLowerCase();
  const pass = document.getElementById("password").value;
  if(usuariosSistema[user] === pass){
    localStorage.setItem("usuario", user);
    location.reload();
  } else {
    document.getElementById("errorLogin").innerText = "Datos incorrectos";
  }
}

function cerrarSesion(){ localStorage.removeItem("usuario"); location.reload(); }

window.onload = () => {
  const user = localStorage.getItem("usuario");
  if(user){
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("userInfo").innerText = `USUARIO: ${user.toUpperCase()}`;
    if(admins.includes(user)) document.getElementById("panelBtn").style.display = "inline-block";
    cargarDatos();
  }
};

function cargarDatos() {
  const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
  fetch(url).then(r => r.json()).then(data => {
    inventario = data.map(p => ({
      id: p.ID,
      producto: p.PRODUCTO,
      categoria: p.CATEGORIA.toUpperCase(),
      talla: p.TALLA,
      color: p.COLOR,
      stock: parseInt(p.STOCK) || 0,
      unidad: parseFloat(p["P.UNIDAD"]),
      docena: parseFloat(p["P.DOCENA"]),
      imagen: p.IMAGEN
    }));
  });
}

// NAVEGACIÓN
function inicio(){
  document.getElementById("menu").style.display = "grid";
  document.getElementById("productos").style.display = "none";
  document.getElementById("seccion-carrito").style.display = "none";
  document.getElementById("panel").style.display = "none";
}

function abrir(cat){
  document.getElementById("menu").style.display = "none";
  const container = document.getElementById("productos");
  container.style.display = "grid";
  
  const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
  const unicos = [...new Map(filtrados.map(item => [item.id, item])).values()];

  container.innerHTML = unicos.map(p => `
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${p.imagen}">
      <h4>${p.producto}</h4>
      <p style="color:lime">S/ ${p.unidad.toFixed(2)}</p>
    </div>
  `).join("") + `<button class="btn-volver" onclick="inicio()" style="grid-column:span 2">⬅ Volver</button>`;
}

function verProducto(id){
  const variantes = inventario.filter(v => v.id == id);
  const p = variantes[0];
  const tallas = [...new Set(variantes.map(v => v.talla))];

  document.getElementById("productos").innerHTML = `
    <div style="grid-column: span 2;">
      <img src="${p.imagen}" style="width:100%; border-radius:15px;">
      <h2>${p.producto}</h2>
      <div class="fila-opciones">
        <div>TALLA: <select id="selTalla" onchange="actualizarColores('${id}')">${tallas.map(t=>`<option value="${t}">${t}</option>`).join("")}</select></div>
        <div>COLOR: <select id="selColor" onchange="actualizarStockUI('${id}')"></select></div>
      </div>
      <div class="fila-opciones">
        <div>STOCK DISPONIBLE: <span id="stockCant" class="stock-alerta">0</span></div>
      </div>
      <button class="btn-finalizar" onclick="agregarAlCarrito('${id}')">🛒 AGREGAR</button>
      <table id="tablaVariantes"></table>
      <button class="btn-volver" onclick="inicio()">⬅ Volver</button>
    </div>
  `;
  actualizarColores(id);
}

function actualizarColores(id){
  const talla = document.getElementById("selTalla").value;
  const filtrados = inventario.filter(v => v.id == id && v.talla == talla);
  document.getElementById("selColor").innerHTML = filtrados.map(v => `<option value="${v.color}">${v.color}</option>`).join("");
  
  document.getElementById("tablaVariantes").innerHTML = `<tr><th>COLOR</th><th>STOCK</th></tr>` + 
    filtrados.map(v => `<tr><td>${v.color}</td><td>${v.stock}</td></tr>`).join("");
  actualizarStockUI(id);
}

function actualizarStockUI(id){
  const t = document.getElementById("selTalla").value;
  const c = document.getElementById("selColor").value;
  const item = inventario.find(v => v.id == id && v.talla == t && v.color == c);
  document.getElementById("stockCant").innerText = item ? item.stock : 0;
}

// LÓGICA DEL CARRITO Y DOCENA
function agregarAlCarrito(id){
  const t = document.getElementById("selTalla").value;
  const c = document.getElementById("selColor").value;
  const itemOriginal = inventario.find(v => v.id == id && v.talla == t && v.color == c);

  if(!itemOriginal || itemOriginal.stock <= 0) return alert("Sin stock");

  const enCarrito = carrito.find(x => x.id == id && x.talla == t && x.color == c);
  
  if(enCarrito){
    if(enCarrito.cantidad >= itemOriginal.stock) return alert("Límite de stock alcanzado");
    enCarrito.cantidad++;
  } else {
    carrito.push({...itemOriginal, cantidad: 1});
  }
  
  alert("Agregado al carrito");
  actualizarContador();
}

function actualizarContador(){
  const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  document.getElementById("btnVerCarrito").innerText = `🛒 Carrito (${total})`;
}

function mostrarCarrito(){
  document.getElementById("menu").style.display = "none";
  document.getElementById("productos").style.display = "none";
  document.getElementById("seccion-carrito").style.display = "block";
  renderizarCarrito();
}

function renderizarCarrito(){
  const lista = document.getElementById("lista-carrito");
  let html = "";
  let sumaTotal = 0;

  // Calculamos el total de unidades por ID para aplicar descuento de docena
  const conteoPorID = {};
  carrito.forEach(item => {
    conteoPorID[item.id] = (conteoPorID[item.id] || 0) + item.cantidad;
  });

  carrito.forEach((item, index) => {
    const totalMismoID = conteoPorID[item.id];
    const esDocena = totalMismoID >= 12;
    const precioUsado = esDocena ? item.docena : item.unidad;
    const subtotal = precioUsado * item.cantidad;
    sumaTotal += subtotal;

    html += `
      <div class="item-carrito">
        <div style="display:flex; justify-content:space-between">
          <b>${item.producto}</b>
          <span style="color:red; cursor:pointer" onclick="quitar(${index})">✕</span>
        </div>
        <div style="font-size:12px; color:gray">${item.talla} | ${item.color} ${esDocena ? '<span style="color:cyan">(Docena)</span>' : ''}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px">
          <div>
            <button class="btn-cant" onclick="cambiarCant(${index}, -1)">-</button>
            <span style="margin: 0 10px">${item.cantidad}</span>
            <button class="btn-cant" onclick="cambiarCant(${index}, 1)">+</button>
          </div>
          <b>S/ ${subtotal.toFixed(2)}</b>
        </div>
      </div>
    `;
  });

  lista.innerHTML = html || "<p>Tu carrito está vacío</p>";
  document.getElementById("totalCarrito").innerText = `S/ ${sumaTotal.toFixed(2)}`;
}

function cambiarCant(index, delta){
  const item = carrito[index];
  const original = inventario.find(v => v.id == item.id && v.talla == item.talla && v.color == item.color);
  
  if(delta > 0 && item.cantidad >= original.stock){
    return alert("No hay más stock disponible");
  }
  
  item.cantidad += delta;
  if(item.cantidad <= 0) carrito.splice(index, 1);
  
  renderizarCarrito();
  actualizarContador();
}

function quitar(index){
  carrito.splice(index, 1);
  renderizarCarrito();
  actualizarContador();
}

function finalizarPedido(){
  if(carrito.length === 0) return alert("El carrito está vacío");
  alert("¡Pedido registrado con éxito!");
  carrito = [];
  actualizarContador();
  inicio();
}

function abrirPanel(){ 
  document.getElementById("menu").style.display = "none";
  document.getElementById("panel").style.display = "block"; 
}
function abrirFormulario(){ window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas(){ window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
