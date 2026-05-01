const usuarios = { luis:"123", katy:"123", dante:"admin123" };
let inventario = [];
let carrito = [];
let descuentoCaja = 0;

window.onload = () => {
    const user = localStorage.getItem("usuario");
    if(user) {
        document.getElementById("login").style.display = "none";
        document.getElementById("app").style.display = "block";
        document.getElementById("userInfo").innerText = `👤 ${user}`;
        cargarInventario();
    }
};

function guardarUsuario() {
    const u = document.getElementById("usuario").value.toLowerCase();
    const p = document.getElementById("password").value;
    if(usuarios[u] === p) {
        localStorage.setItem("usuario", u);
        location.reload();
    } else {
        alert("Error de acceso");
    }
}

async function cargarInventario() {
    const url = "https://opensheet.elk.sh/197The7KApBX0G_p9PCTiAAWZ1oBMLDWQEZIeUDHgXpE/INVENTARIO";
    const res = await fetch(url);
    const data = await res.json();
    inventario = data.map(item => ({
        id: item.ID,
        producto: item.PRODUCTO,
        categoria: item.CATEGORIA.toUpperCase(),
        precio: parseFloat(item["P.UNIDAD"]),
        docena: parseFloat(item["P.DOCENA"]),
        imagen: item.IMAGEN
    }));
}

function aplicarDescuento() {
    const val = parseFloat(document.getElementById("inputDescuento").value);
    descuentoCaja = isNaN(val) ? 0 : val;
    renderizarCarrito(); // Recalcula visualmente
}

function renderizarCarrito() {
    const lista = document.getElementById("lista-carrito");
    let subtotal = 0;
    lista.innerHTML = "";

    carrito.forEach(p => {
        subtotal += p.precio * p.cantidad;
        lista.innerHTML += `<div>${p.producto} x ${p.cantidad} - S/ ${(p.precio * p.cantidad).toFixed(2)}</div>`;
    });

    document.getElementById("subtotalCarrito").innerText = `S/ ${subtotal.toFixed(2)}`;
    const total = subtotal - descuentoCaja;
    document.getElementById("totalFinalCarrito").innerText = `S/ ${(total < 0 ? 0 : total).toFixed(2)}`;
}

// ... funciones de abrir categorías y agregar productos ...
