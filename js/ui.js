function render(lista){
  let html="";

  lista.forEach(p=>{
    html+=`
    <div class="card" onclick="verProducto('${p.id}')">
      <img src="${p.imagen}">
      <h3>${p.producto}</h3>
      <p>S/ ${p.unidad}</p>
    </div>`;
  });

  productos.innerHTML=html;
}
