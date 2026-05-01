const usuariosSistema = {
  luis:"123",
  katy:"123",
  katherine:"123",
  richard:"123",
  dante:"admin123"
};

const admins=["dante"];

function guardarUsuario(){
  const user=usuario.value.toLowerCase();
  const pass=password.value;

  if(!usuariosSistema[user]) return errorLogin.innerText="Usuario no registrado";
  if(usuariosSistema[user]!==pass) return errorLogin.innerText="Contraseña incorrecta";

  localStorage.setItem("usuario",user);
  location.reload();
}

function cerrarSesion(){
  localStorage.removeItem("usuario");
  location.reload();
}
