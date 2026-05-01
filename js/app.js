function abrir(cat){
  menu.style.display="none";
  productos.style.display="grid";
  render(getByCategory(cat));
}

function inicio(){
  menu.style.display="grid";
  productos.style.display="none";
  panel.style.display="none";
}

function verProducto(id){
  const p=inventario.find(x=>x.id==id);

  productos.innerHTML=`
  <div>
    <h2>${p.producto}</h2>
    <p>Stock: ${p.stock}</p>

    <button onclick="inicio()">⬅ Volver</button>
  </div>`;
}

function abrirPanel(){
  panel.style.display="block";
  menu.style.display="none";
  productos.style.display="none";
}

function abrirFormulario(){
  window.open("https://docs.google.com/forms");
}

function verVentas(){
  window.open("https://docs.google.com/spreadsheets");
}
