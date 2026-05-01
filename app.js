// USUARIOS
const usuariosSistema = {
  luis:"123",
  katy:"123",
  katherine:"123",
  richard:"123",
  dante:"admin123"
};
const admins = ["dante"];

// LOGIN
function guardarUsuario(){
  // Es una buena práctica capturar los elementos por su ID explícitamente
  const usuarioInput = document.getElementById("usuario");
  const passwordInput = document.getElementById("password");
  const errorLogin = document.getElementById("errorLogin");

  const user = usuarioInput.value.toLowerCase();
  const pass = passwordInput.value;

  if(!usuariosSistema[user]) return errorLogin.innerText="Usuario no registrado";
  if(usuariosSistema[user]!==pass) return errorLogin.innerText="Contraseña incorrecta";

  localStorage.setItem("usuario",user);
  location.reload();
}

function cerrarSesion(){
  localStorage.removeItem("usuario");
  location.reload();
}

// UI - Carga inicial
window.onload=()=>{
  const user = localStorage.getItem("usuario");
  const login = document.getElementById("login");
  const app = document.getElementById("app");
  const userInfo = document.getElementById("userInfo");
  const panelBtn = document.getElementById("panelBtn");

  login.style.display = user ? "none" : "flex";
  app.style.display = user ? "block" : "none";

  if(user){
    userInfo.innerHTML = `USUARIO: ${user.toUpperCase()}`;
    if(admins.includes(user)) panelBtn.style.display = "inline-block";
  }
};

// INVENTARIO
const urlInv="https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
let inventario=[];

fetch(urlInv)
.then(r=>r.json())
.then(d=>{
  inventario=d.map(p=>{
    let o={};
    Object.keys(p).forEach(k=>o[k.toLowerCase().trim()]=p[k]);

    return {
      id:o.id,
      producto:o.producto,
      categoria:(o.categoria||"").toUpperCase(),
      talla:o.talla,
      color:o.color,
      stock:parseInt(o.stock)||0,
      unidad:o["p.unidad"],
      docena:o["p.docena"],
      imagen:o.imagen
    };
  });
});

// MENU
function abrir(cat){
  document.getElementById("menu").style.display="none";
  const productos = document.getElementById("productos");
  productos.style.display="grid";

  const filtrados=inventario.filter(p=>p.categoria===cat && p.stock>0);

  const unicos={};
  filtrados.forEach(p=>{ if(!unicos[p.id]) unicos[p.id]=p; });

  render(Object.values(unicos));

  productos.innerHTML+=`<button onclick="inicio()">⬅ Volver</button>`;
}

function inicio(){
  document.getElementById("menu").style.display="grid";
  document.getElementById("productos").style.display="none";
  document.getElementById("panel").style.display="none";
}

// LISTA
function render(lista){
  let html="";
  lista.forEach(p=>{
    html+=`
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${p.imagen}">
      <h3>${p.producto}</h3>
      <p style="color:lime;">S/ ${p.unidad}</p>
    </div>`;
  });
  document.getElementById("productos").innerHTML=html;
}

// DETALLE
function verProducto(id){
  const variantes=inventario.filter(p=>p.id==id);
  const p=variantes[0];

  const tallas=[...new Set(variantes.map(v=>v.talla))];
  const stockTotal=variantes.reduce((a,b)=>a+b.stock,0);

  document.getElementById("productos").innerHTML=`
    <div>
      <img class="detalle-img" src="${p.imagen}">
      <h2>${p.producto}</h2>

      <div class="fila-opciones">
        <div>
          🧵 TALLAS
          <select id="tallaSelect" onchange="cambiarTalla('${id}')">
            ${tallas.map(t=>`<option value="${t}">${t}</option>`).join("")}
            <option value="TODAS">TODAS</option>
          </select>
        </div>
        <div>
          📦 STOCK
          <span class="stock" id="stockTalla">0</span>
        </div>
        <div>
          📊 TOTAL
          <span class="total">${stockTotal}</span>
        </div>
      </div>

      <table id="tablaDetalle"></table>

      <button onclick="volverLista('${p.categoria}')">⬅ Volver</button>
    </div>
  `;

  cambiarTalla(id);
}

// FILTRO
function cambiarTalla(id){
  const talla=document.getElementById("tallaSelect").value;
  let filtrados;

  if(talla==="TODAS"){
    filtrados=inventario.filter(p=>p.id==id);
  } else {
    filtrados=inventario.filter(p=>p.id==id && p.talla==talla);
  }

  const total=filtrados.reduce((a,b)=>a+b.stock,0);
  document.getElementById("stockTalla").innerText=total;

  let filas=`
    <tr>
      <th>TALLA</th><th>COLOR</th><th>STOCK</th><th>P.UNIDAD</th><th>P.DOCENA</th>
    </tr>
  `;

  filtrados.forEach(v=>{
    filas+=`
      <tr>
        <td>${v.talla}</td>
        <td>${v.color}</td>
        <td>${v.stock}</td>
        <td>S/ ${v.unidad}</td>
        <td>S/ ${v.docena}</td>
      </tr>
    `;
  });

  document.getElementById("tablaDetalle").innerHTML=filas;
}

// VOLVER
function volverLista(cat){
  abrir(cat);
}

// PANEL
function abrirPanel(){
  document.getElementById("menu").style.display="none";
  document.getElementById("panel").style.display="block";
}

function abrirFormulario(){
  window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform");
}

function verVentas(){
  window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE");
}
let carrito = [];
let descuentoGlobal = 0;

// Función para agregar al carrito (llamar desde el botón de la tabla de detalles)
function agregarAlCarrito(id, talla, color) {
    const item = inventario.find(p => p.id == id && p.talla == talla && p.color == color);
    
    const existe = carrito.find(c => c.id == id && c.talla == talla && c.color == color);
    if(existe) {
        existe.cantidad++;
    } else {
        carrito.push({ ...item, cantidad: 1 });
    }
    
    alert("Agregado al carrito");
    verCarrito(); // Mostramos el carrito al agregar
}

function verCarrito() {
    document.getElementById("menu").style.display = "none";
    document.getElementById("productos").style.display = "none";
    document.getElementById("carrito").style.display = "block";
    renderCarrito();
}

function renderCarrito() {
    const lista = document.getElementById("lista-carrito");
    let html = "";
    let subtotalGeneral = 0;

    carrito.forEach((item, index) => {
        // LÓGICA DE PRECIO: Si es 12 o más, usamos precio docena
        const precioUsar = item.cantidad >= 12 ? parseFloat(item.docena) : parseFloat(item.unidad);
        const subtotalItem = precioUsar * item.cantidad;
        subtotalGeneral += subtotalItem;

        html += `
        <div class="item-carrito">
            <div class="info-principal">${item.producto} <button class="btn-eliminar" onclick="eliminarItem(${index})">X</button></div>
            <div class="grid-carrito">
                <span>T: ${item.talla}</span>
                <span>C: ${item.color}</span>
                <div class="controles-cant">
                    <button class="btn-cant" onclick="cambiarCant(${index}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-cant" onclick="cambiarCant(${index}, 1)">+</button>
                </div>
                <span style="text-align:right">S/ ${subtotalItem.toFixed(2)}</span>
            </div>
            <small style="color:gray">${item.cantidad >= 12 ? '(Precio Docena aplicado)' : '(Precio Unidad)'}</small>
        </div>`;
    });

    lista.innerHTML = html;
    const totalFinal = subtotalGeneral - descuentoGlobal;
    document.getElementById("precioTotalCarrito").innerText = `S/ ${totalFinal.toFixed(2)}`;
}

function cambiarCant(index, valor) {
    carrito[index].cantidad += valor;
    if(carrito[index].cantidad <= 0) return eliminarItem(index);
    renderCarrito();
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    renderCarrito();
}

function aplicarDescuento() {
    descuentoGlobal = parseFloat(document.getElementById("montoDescuento").value) || 0;
    renderCarrito();
}

// MODIFICACIÓN DE LA TABLA DE DETALLES:
// Para que esto funcione, debes modificar tu función cambiarTalla en app.js 
// para agregar un botón de "Añadir" en cada fila de la tabla:
// Ejemplo dentro del filtrados.forEach de cambiarTalla:
// <td><button onclick="agregarAlCarrito('${v.id}','${v.talla}','${v.color}')" style="margin:0; padding:5px; font-size:10px;">🛒</button></td>
