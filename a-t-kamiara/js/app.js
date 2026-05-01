window.onload=()=>{
  const user=localStorage.getItem("usuario");

  login.style.display=user?"none":"flex";
  app.style.display=user?"block":"none";

  if(user){
    userInfo.innerHTML=`USUARIO: ${user.toUpperCase()}`;
    if(admins.includes(user)) panelBtn.style.display="inline-block";
  }

  cargarInventario();
};
function abrir(cat){
  menu.style.display="none";
  productos.style.display="grid";

  const filtrados=inventario.filter(p=>p.categoria===cat && p.stock>0);

  const unicos={};
  filtrados.forEach(p=>unicos[p.id]=p);

  render(Object.values(unicos));
}

function verProducto(id){

  const variantes=inventario.filter(p=>p.id==id);
  const p=variantes[0];

  const stockTotal=variantes.reduce((a,b)=>a+b.stock,0);

  productos.innerHTML=`
    <div>
      <img src="${p.imagen}">
      <h2>${p.producto}</h2>

      <div class="fila-opciones">
        <div>📦 ${stockTotal}</div>
      </div>

      <button onclick="volver()">⬅ Volver</button>
    </div>
  `;
}

function volver(){
  menu.style.display="grid";
  productos.style.display="none";
}
