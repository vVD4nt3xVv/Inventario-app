// USUARIOS
const usuariosSistema = {
  luis: "123",
  katy: "123",
  katherine: "123",
  richard: "123",
  dante: "admin123"
};
const admins = ["dante"];

// LOGIN
function guardarUsuario(){
  const user = usuario.value.toLowerCase();
  const pass = password.value;

  if(!usuariosSistema[user]) return errorLogin.innerText = "Usuario no registrado";
  if(usuariosSistema[user] !== pass) return errorLogin.innerText = "Contraseña incorrecta";

  localStorage.setItem("usuario", user);
  location.reload();
}

function cerrarSesion(){
  localStorage.removeItem("usuario");
  location.reload();
}

// UI
window.onload = () => {
  const user = localStorage.getItem("usuario");

  login.style.display = user ? "none" : "flex";
  app.style.display = user ? "block" : "none";

  if(user){
    userInfo.innerHTML = `USUARIO: ${user.toUpperCase()}`;
    if(admins.includes(user)) panelBtn.style.display = "inline-block";
  }
};

// INVENTARIO
const urlInv = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
let inventario = [];

fetch(urlInv)
.then(r => r.json())
.then(d => {
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
      unidad: o["p.unidad"],
      docena: o["p.docena"],
      imagen: o.imagen
    };
  });
});

// MENU
function abrir(cat){
  menu.style.display = "none";
  productos.style.display = "grid";

  const filtrados = inventario.filter(p => p.categoria === cat && p.stock > 0);

  const unicos = {};
  filtrados.forEach(p => { if(!unicos[p.id]) unicos[p.id] = p; });

  render(Object.values(unicos));

  productos.innerHTML += `<button onclick="inicio()">⬅ Volver</button>`;
}

function inicio(){
  menu.style.display = "grid";
  productos.style.display = "none";
  panel.style.display = "none";
}

// LISTA
function render(lista){
  let html = "";
  lista.forEach(p => {
    html += `
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${p.imagen}">
      <h3>${p.producto}</h3>
      <p style="color:lime;">S/ ${p.unidad}</p>
    </div>`;
  });
  productos.innerHTML = html;
}

// DETALLE
function verProducto(id){
  const variantes = inventario.filter(p => p.id == id);
  const p = variantes[0];

  const tallas = [...new Set(variantes.map(v => v.talla))];
  const stockTotal = variantes.reduce((a, b) => a + b.stock, 0);

  productos.innerHTML = `
    <div>
      <img class="detalle-img" src="${p.imagen}">
      <h2>${p.producto}</h2>

      <div class="fila-opciones">
        <div>
          🧵 TALLAS
          <select id="tallaSelect" onchange="cambiarTalla('${id}')">
            ${tallas.map(t => `<option value="${t}">${t}</option>`).join("")}
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
  const talla = document.getElementById("tallaSelect").value;
  let filtrados;

  if(talla === "TODAS"){
    filtrados = inventario.filter(p => p.id == id);
  } else {
    filtrados = inventario.filter(p => p.id == id && p.talla == talla);
  }

  const total = filtrados.reduce((a, b) => a + b.stock, 0);
  document.getElementById("stockTalla").innerText = total;

  let filas = `
    <tr>
      <th>TALLA</th><th>COLOR</th><th>STOCK</th><th>P.UNIDAD</th><th>P.DOCENA</th>
    </tr>
  `;

  filtrados.forEach(v => {
    filas += `
      <tr>
        <td>${v.talla}</td>
        <td>${v.color}</td>
        <td>${v.stock}</td>
        <td>S/ ${v.unidad}</td>
        <td>S/ ${v.docena}</td>
      </tr>
    `;
  });

  document.getElementById("tablaDetalle").innerHTML = filas;
}

// VOLVER
function volverLista(cat){
  abrir(cat);
}

// PANEL
function abrirPanel(){
  menu.style.display = "none";
  panel.style.display = "block";
}

function abrirFormulario(){
  window.open("https://docs.google.com/forms/d/e/1FAIpQLSfkDXdS7HH4ud4ephIeo0qMyiXqiNXLjs_gpmZF7fDqBoE73A/viewform");
}

function verVentas(){
  window.open("https://docs.google.com/spreadsheets/d/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE");
}
