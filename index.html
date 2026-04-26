<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Inventario</title>

<style>
body {
  background: #0b0b0b;
  color: white;
  font-family: Arial;
  margin: 0;
}

#productos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.card {
  width: 45%;
  margin: 10px;
  padding: 10px;
  border-radius: 15px;
  background: #111;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
}

img {
  width: 100%;
  border-radius: 10px;
}

button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: red;
  color: white;
  font-weight: bold;
}
</style>
</head>

<body>

<h2 style="text-align:center;">📦 Inventario</h2>

<div id="productos"></div>

<script>
const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";

// 🔥 CAMBIA ESTO LUEGO
const FORM = "https://docs.google.com/forms/d/e/TU_FORM_ID/viewform";
const ENTRY_PRODUCTO = "entry.111111";
const ENTRY_CANTIDAD = "entry.222222";

fetch(url)
.then(r => r.json())
.then(data => {

  let html = "";

  data.forEach(p => {

    let obj = {};
    Object.keys(p).forEach(k=>{
      obj[k.trim().toLowerCase()] = p[k];
    });

    const nombre = obj["producto"] || "Producto";
    const precio = obj["precio"] || 0;
    const stock = obj["stock"] || 0;
    const imagen = obj["imagen"] || "https://via.placeholder.com/150";

    const link = `${FORM}?${ENTRY_PRODUCTO}=${encodeURIComponent(nombre)}&${ENTRY_CANTIDAD}=1`;

    html += `
      <div class="card">
        <img src="${imagen}">
        <h3>${nombre}</h3>
        <p>💲 S/ ${precio}</p>
        <p style="color:${stock <= 5 ? 'red' : 'lime'};">
          📦 ${stock}
        </p>
        <a href="${link}" target="_blank">
          <button>VENDER</button>
        </a>
      </div>
    `;
  });

  document.getElementById("productos").innerHTML = html;
});
</script>

</body>
</html>
