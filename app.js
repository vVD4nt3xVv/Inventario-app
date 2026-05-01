const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];

function guardarUsuario(){
  const user = document.getElementById("usuario").value.toLowerCase();
  const pass = document.getElementById("password").value;
  if(!usuariosSistema[user]) return document.getElementById("errorLogin").innerText="Usuario no registrado";
  if(usuariosSistema[user]!==pass) return document.getElementById("errorLogin").innerText="Contraseña incorrecta";
  localStorage.setItem("usuario",user);
  location.reload();
}

function cerrarSesion(){ localStorage.removeItem("usuario"); location.reload(); }

window.onload=()=>{
  const user = localStorage.getItem("usuario");
  if(user){
    document.getElementById("login").style.display = "none";
    document.getElementById("app").style.display = "block";
    document.getElementById("userInfo").innerHTML = `USUARIO: ${user.toUpperCase()}`;
    if(admins.includes(user)) document.getElementById("panelBtn").style.display = "inline-block";
    cargarDatos();
  }
};

function cargarDatos() {
    const urlInv = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
    fetch(urlInv).then(r=>r.json()).then(d=>{
      inventario = d.map(p=>{
        let o = {};
        Object.keys(p).forEach(k=>o[k.toLowerCase().trim()]=p[k]);
        return {
          id: o.id, producto: o.producto, categoria: (o.categoria||"").toUpperCase(),
          talla: o.talla, color: o.color, stock: parseInt(o.stock)||0,
          unidad: parseFloat(o["p.unidad"]), docena: parseFloat(o["p.docena"]), imagen: o.imagen
        };
      });
    });
}

function ocultarTodo() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "none";
    document.getElementById("seccion-carrito").style.display = "none";
    document.getElementById("panel").style.display = "none";
}

function inicio(){
    ocultarTodo();
    document.getElementById("menu").style.display = "grid";
}

function abrir(cat){
  ocultarTodo();
  const prodCont = document.getElementById("productos");
  prodCont.style.display = "grid";
  const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);
  const unicos = {};
  filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });
  
  let html = "";
  Object.values(unicos).forEach(p => {
    html += `<div class="card" onclick="verProducto('${p.id}')">
      <img src="${p.imagen}">
      <h3>${p.producto}</h3>
      <p style="color:lime;">S/ ${p.unidad.toFixed(2)}</p>
    </div>`;
  });
  prodCont.innerHTML = html + `<button onclick="inicio()" style="grid-column: span 2; background:#333;">⬅ Volver</button>`;
}

function verProducto(id){
  const variantes = inventario.filter(p => p.id == id);
  const p = variantes[0];
  const tallas = [...new Set(variantes.map(v => v.talla))];
  const stockTotal = variantes.reduce((a,b) => a + b.stock, 0);

  document.getElementById("productos").innerHTML = `
    <div style="grid-column: span 2;">
      <img class="detalle-img" src="${p.imagen}">
      <h2>${p.producto}</h2>
      <div class="fila-opciones">
        <div>TALLA <br> <select id="tallaSelect" onchange="cambiarTalla('${id}')">${tallas.map(t=>`<option value="${t}">${t}</option>`).join("")}</select></div>
        <div>COLOR <br> <select id="colorSelect" onchange="refrescarStock('${id}')"></select></div>
      </div>
      <div class="fila-opciones">
        <div>STOCK: <span class="stock" id="stockTalla">0</span></div>
        <div style="color:#00aaff;">TOTAL: ${stockTotal}</div>
      </div>
      <button style="background:#28a745;" onclick="añadir('${id}')">🛒 AÑADIR AL CARRITO</button>
      <table id="tablaDetalle"></table>
      <button style="background:#333;" onclick="abrir('${p.categoria}')">⬅ Volver</button>
    </div>`;
  cambiarTalla(id);
}

function cambiarTalla(id){
  const talla = document.getElementById("tallaSelect").value;
  const filtrados = inventario.filter(p => p.id == id && p.talla == talla);
  const selectColor = document.getElementById("colorSelect");
  selectColor.innerHTML = filtrados.map(v => `<option value="${v.color}">${v.color}</option>`).join("");
  
  let filas = `<tr><th>COLOR</th><th>STOCK</th><th>P.UNID</th></tr>`;
  filtrados.forEach(v => { filas += `<tr><td>${v.color}</td><td>${v.stock}</td><td>S/ ${v.unidad.toFixed(2)}</td></tr>`; });
  document.getElementById("tablaDetalle").innerHTML = filas;
  refrescarStock(id);
}

function refrescarStock(id) {
    const t = document.getElementById("tallaSelect").value;
    const c = document.getElementById("colorSelect").value;
    const item = inventario.find(p => p.id == id && p.talla == t && p.color == c);
    document.getElementById("stockTalla").innerText = item ? item.stock : 0;
}

function añadir(id) {
    const t = document.getElementById("tallaSelect").value;
    const c = document.getElementById("colorSelect").value;
    const original = inventario.find(p => p.id == id && p.talla == t && p.color == c);
    if(!original || original.stock <= 0) return alert("Sin stock");

    const enCarrito = carrito.find(x => x.id == id && x.talla == t && x.color == c);
    if(enCarrito) {
        if(enCarrito.cantidad >= original.stock) return alert("No hay más stock");
        enCarrito.cantidad++;
    } else {
        carrito.push({...original, cantidad: 1});
    }
    actualizarContador();
    alert("Producto agregado");
}

function actualizarContador() {
    const total = carrito.reduce((a, b) => a + b.cantidad, 0);
    document.getElementById("btnVerCarrito").innerText = `🛒 Carrito (${total})`;
}

function mostrarCarrito() {
    ocultarTodo();
    document.getElementById("seccion-carrito").style.display = "block";
    renderCarrito();
}

function renderCarrito() {
    const div = document.getElementById("lista-carrito");
    let html = "", totalGral = 0;

    // LÓGICA CLAVE: Sumar todas las cantidades que tengan el mismo ID
    const conteoPorID = {};
    carrito.forEach(item => {
        conteoPorID[item.id] = (conteoPorID[item.id] || 0) + item.cantidad;
    });

    carrito.forEach((item, index) => {
        // Si el total acumulado de ese producto (varios colores/tallas) es >= 12
        const esDocena = conteoPorID[item.id] >= 12;
        const precioReal = esDocena ? item.docena : item.unidad;
        const subtotal = precioReal * item.cantidad;
        totalGral += subtotal;

        html += `<div class="item-carrito">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <b>${item.producto}</b>
                <span style="color:red; font-weight:bold; cursor:pointer;" onclick="eliminar(${index})">✕</span>
            </div>
            <div style="font-size:12px; color:#aaa; margin:5px 0;">
                ${item.talla} | ${item.color} ${esDocena ? '<span style="color:#00ff88;">(Precio Docena)</span>' : ''}
            </div>
            <div class="controles-carrito">
                <div>
                    <button class="btn-cant" onclick="sumar(${index}, -1)">-</button>
                    <span style="margin:0 10px;">${item.cantidad}</span>
                    <button class="btn-cant" onclick="sumar(${index}, 1)">+</button>
                </div>
                <b style="color:white;">S/ ${subtotal.toFixed(2)}</b>
            </div>
        </div>`;
    });

    div.innerHTML = html || "<p style='text-align:center; padding:20px;'>Carrito vacío</p>";
    document.getElementById("totalCarrito").innerText = `S/ ${totalGral.toFixed(2)}`;
}

function sumar(idx, n) {
    const item = carrito[idx];
    const original = inventario.find(p => p.id == item.id && p.talla == item.talla && p.color == item.color);
    if(n > 0 && item.cantidad >= original.stock) return alert("Máximo stock disponible");
    item.cantidad += n;
    if(item.cantidad <= 0) return eliminar(idx);
    renderCarrito();
    actualizarContador();
}

function eliminar(idx) {
    carrito.splice(idx, 1);
    renderCarrito();
    actualizarContador();
}

function finalizarPedido() {
    if(carrito.length === 0) return;
    alert("¡Pedido enviado con éxito!");
    carrito = [];
    actualizarContador();
    inicio();
}

function abrirPanel(){ ocultarTodo(); document.getElementById("panel").style.display="block"; }
function abrirFormulario(){ window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas(){ window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
