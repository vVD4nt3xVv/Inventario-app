const usuariosSistema = { luis:"123", katy:"123", katherine:"123", richard:"123", dante:"admin123" };
const admins = ["dante"];
let inventario = [];
let carrito = [];

// LOGIN
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
  document.getElementById("login").style.display = user ? "none" : "flex";
  document.getElementById("app").style.display = user ? "block" : "none";
  if(user){
    document.getElementById("userInfo").innerHTML = `USUARIO: ${user.toUpperCase()}`;
    if(admins.includes(user)) document.getElementById("panelBtn").style.display = "inline-block";
    cargarDatos();
  }
};

function cargarDatos() {
  const urlInv = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
  fetch(urlInv).then(r=>r.json()).then(d=>{
    inventario = d.map(p=>{
      let o={};
      Object.keys(p).forEach(k=>o[k.toLowerCase().trim()]=p[k]);
      return {
        id:o.id, producto:o.producto, categoria:(o.categoria||"").toUpperCase(),
        talla:o.talla, color:o.color, stock:parseInt(o.stock)||0,
        unidad:parseFloat(o["p.unidad"]), docena:parseFloat(o["p.docena"]), imagen:o.imagen
      };
    });
  });
}

// NAVEGACIÓN
function inicio(){
  document.getElementById("menu").style.display="grid";
  document.getElementById("productos").style.display="none";
  document.getElementById("seccion-carrito").style.display="none";
  document.getElementById("panel").style.display="none";
}

function abrir(cat){
  document.getElementById("menu").style.display="none";
  document.getElementById("productos").style.display="grid";
  const filtrados = inventario.filter(p=>p.categoria===cat && p.stock>0);
  const unicos = {};
  filtrados.forEach(p=>{ if(!unicos[p.id]) unicos[p.id]=p; });

  let html = Object.values(unicos).map(p=>`
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${p.imagen}">
      <h3>${p.producto}</h3>
      <p style="color:lime;">S/ ${p.unidad.toFixed(2)}</p>
    </div>`).join("");
  
  document.getElementById("productos").innerHTML = html + `<button onclick="inicio()" style="grid-column: span 2; background:#333;">⬅ Volver</button>`;
}

// DETALLE CON SELECCIÓN
function verProducto(id){
  const variantes = inventario.filter(p=>p.id==id);
  const p = variantes[0];
  const tallas = [...new Set(variantes.map(v=>v.talla))];

  document.getElementById("productos").innerHTML = `
    <div style="grid-column: span 2;">
      <img class="detalle-img" src="${p.imagen}">
      <h2>${p.producto}</h2>
      <div class="fila-opciones">
        <div>🧵 TALLA <select id="selTalla" onchange="cambiarTalla('${id}')">${tallas.map(t=>`<option value="${t}">${t}</option>`).join("")}</select></div>
        <div>🎨 COLOR <select id="selColor" onchange="actualizarStock('${id}')"></select></div>
      </div>
      <div class="fila-opciones">
        <div>📦 STOCK <span class="stock" id="stockTalla">0</span></div>
        <div>📊 TOTAL <span class="total">${variantes.reduce((a,b)=>a+b.stock,0)}</span></div>
      </div>
      <button style="background:#28a745;" onclick="agregarCarrito('${id}')">🛒 AÑADIR AL CARRITO</button>
      <table id="tablaDetalle"></table>
      <button style="background:#333;" onclick="abrir('${p.categoria}')">⬅ Volver</button>
    </div>`;
  cambiarTalla(id);
}

function cambiarTalla(id){
  const talla = document.getElementById("selTalla").value;
  const filtrados = inventario.filter(p=>p.id==id && p.talla==talla);
  document.getElementById("selColor").innerHTML = filtrados.map(v=>`<option value="${v.color}">${v.color}</option>`).join("");
  
  document.getElementById("tablaDetalle").innerHTML = `<tr><th>COLOR</th><th>STOCK</th><th>P.UNID</th></tr>` + 
    filtrados.map(v=>`<tr><td>${v.color}</td><td>${v.stock}</td><td>S/ ${v.unidad}</td></tr>`).join("");
  actualizarStock(id);
}

function actualizarStock(id){
  const t = document.getElementById("selTalla").value;
  const c = document.getElementById("selColor").value;
  const item = inventario.find(p=>p.id==id && p.talla==t && p.color==c);
  document.getElementById("stockTalla").innerText = item ? item.stock : 0;
}

// LÓGICA CARRITO
function agregarCarrito(id){
  const t = document.getElementById("selTalla").value;
  const c = document.getElementById("selColor").value;
  const itemInv = inventario.find(p=>p.id==id && p.talla==t && p.color==c);

  if(!itemInv || itemInv.stock <= 0) return alert("No hay stock disponible");

  const enCarrito = carrito.find(x=>x.id==id && x.talla==t && x.color==c);
  if(enCarrito){
    if(enCarrito.cantidad >= itemInv.stock) return alert("Máximo stock alcanzado");
    enCarrito.cantidad++;
  } else {
    carrito.push({...itemInv, cantidad: 1});
  }
  alert("Agregado!");
  actualizarBtnCarrito();
}

function actualizarBtnCarrito(){
  const total = carrito.reduce((a,b)=>a+b.cantidad, 0);
  document.getElementById("btnVerCarrito").innerText = `🛒 Carrito (${total})`;
}

function mostrarCarrito(){
  document.getElementById("menu").style.display="none";
  document.getElementById("productos").style.display="none";
  document.getElementById("seccion-carrito").style.display="block";
  renderizarCarrito();
}

function renderizarCarrito(){
  const lista = document.getElementById("lista-carrito");
  let html = "", totalGral = 0;

  // Lógica de docena por ID: Sumamos cantidades totales de un mismo ID
  const totalesPorID = {};
  carrito.forEach(item => {
    totalesPorID[item.id] = (totalesPorID[item.id] || 0) + item.cantidad;
  });

  carrito.forEach((item, index) => {
    // Si la suma de ese ID (independiente de color/talla) es >= 12, se aplica precio docena
    const esDocena = totalesPorID[item.id] >= 12;
    const precioFinal = esDocena ? item.docena : item.unidad;
    const subtotal = precioFinal * item.cantidad;
    totalGral += subtotal;

    html += `
      <div class="item-carrito">
        <div style="display:flex; justify-content:space-between">
          <b>${item.producto}</b>
          <span style="color:red; cursor:pointer" onclick="quitar(${index})">✕</span>
        </div>
        <div style="font-size:12px; color:gray">${item.talla} | ${item.color} ${esDocena ? '<span style="color:#00ff88;">(Docena)</span>':''}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px">
          <div>
            <button class="btn-cant" onclick="modificar(${index}, -1)">-</button>
            <span style="margin:0 10px">${item.cantidad}</span>
            <button class="btn-cant" onclick="modificar(${index}, 1)">+</button>
          </div>
          <b>S/ ${subtotal.toFixed(2)}</b>
        </div>
      </div>`;
  });

  lista.innerHTML = html || "<p style='text-align:center'>Carrito vacío</p>";
  document.getElementById("totalCarrito").innerText = `S/ ${totalGral.toFixed(2)}`;
}

function modificar(idx, n){
  const item = carrito[idx];
  const inv = inventario.find(p=>p.id==item.id && p.talla==item.talla && p.color==item.color);
  if(n > 0 && item.cantidad >= inv.stock) return alert("Stock máximo");
  item.cantidad += n;
  if(item.cantidad <= 0) carrito.splice(idx,1);
  renderizarCarrito();
  actualizarBtnCarrito();
}

function quitar(idx){
  carrito.splice(idx, 1);
  renderizarCarrito();
  actualizarBtnCarrito();
}

function finalizarPedido(){
  if(carrito.length === 0) return;
  alert("Pedido enviado correctamente");
  carrito = [];
  actualizarBtnCarrito();
  inicio();
}

// PANEL
function abrirPanel(){
  document.getElementById("menu").style.display="none";
  document.getElementById("panel").style.display="block";
}
function abrirFormulario(){ window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform"); }
function verVentas(){ window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE"); }
