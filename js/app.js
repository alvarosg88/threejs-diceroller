/* Variables que contendrán los objetos de los elementos del escenario */
var world, scene, camera, renderer, controls;
var table;
var wall1,wall2,wall3,wall_body1,wall_body2,wall_body3,wall_updater1,wall_updater2,wall_updater3;
var table_texture;
var table_normal;
var dices = [];
var ground;
var updater_g;
/*var oimoStats;*/
var meshFaceMaterial;
var dice_texture, normalDice;
var meshFaceMaterial; 
/*var shadowCam;*/
    
/* Inicializamos la secuencia utilizando el evento onload */
window.onload=function(){
  init();
  animate();
}

/* En la función init cargaremos recursos de texturas de forma asíncrona, 
   instanciaremos los elementos del escenario y la configuración básica de Oimo.js para la física.  
   Se ha subdivido en varias funciones más simples para facilitar la comprensión de todo el proceso. 
   ESTO ES MUY ÚTIL PARA ESTABLECER FUNCIONES DE CONFIGURACIÓN BÁSICA REUTILIZABLES */
function init() {
    basicConfig(); // Configuración básica ( renderizador, cámara, escena, Oimo.js, eventos )
    getLights(); // Iluminación y sombras
    loadResources(); // Carga asíncrona de imágenes para texturas
    createTable(); // Crea el modelo de la mesa de madera
    createWalls(); // Crea "muros" invisibles que evitarán que los dados caigan al vacío
}

/* En la función animate se incluyen las instrucciones encargadas del comportamiento en tiempo real de los elementos del escenario, 
   tanto de Three.js como de Oimo.js */
function animate() {
  requestAnimationFrame( animate ); // Establecemos que la función animate se a ejecutar en tiempo real en cada refresco de pantalla
    
  // Activamos los actualizadores de los elementos del escenario afectados por el motor de física
  if (world)
      world.step();
  if (updater_g)
      updater_g.update();
  if (wall_updater1)
      wall_updater1.update();
  if (wall_updater2)
      wall_updater2.update();
  if (wall_updater3)
      wall_updater3.update();
    
  for ( var i =0 ; i < dices.length; i++ ){
      if(dices[i].updater)
        dices[i].updater.update();
  }
    
  /* Mostramos en tiempo real los valores de posición y rotación de la cámara en x,y,z 
     para ayudarnos a la hora de establecer sus valores iniciales y conseguir la posición de cámara deseada */
    
  /*console.log('----------') 
  console.log(camera.position.x)s
  console.log(camera.position.y)
  console.log(camera.position.z)
  console.log(camera.rotation.x)
  console.log(camera.rotation.y)
  console.log(camera.rotation.z)
  console.log('----------')*/
    
  //oimoStats.update(); //Actualización en tiempo real de información de consola de debug de Oimo.js
  render();
}

function render() {
  renderer.render( scene, camera ); // Se renderiza la escena en tiempo real a través de una cámara
}