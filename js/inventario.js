const urlInv="https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";

let inventario=[];

async function cargarInventario(){
  const res = await fetch(urlInv);
  const data = await res.json();

  inventario = data.map(p=>{
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
}

function getProducto(id){
  return inventario.filter(p=>p.id==id);
}
