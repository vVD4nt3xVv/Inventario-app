let inventario=[];

async function cargarInventario(){
  const url="https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
  const res=await fetch(url);
  const data=await res.json();

  inventario=data.map(p=>{
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

function getByCategory(cat){
  return inventario.filter(p=>p.categoria===cat && p.stock>0);
}
