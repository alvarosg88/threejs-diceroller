/*
 * basicConfig() - Configuración básica del escenario three.js y de las propiedades de instancia del motor Oimo.js, así como escuchadores de eventos para interfaz
 */
function basicConfig(){

    /* Nuevo RENDERIZADOR WebGL - Activamos suavizado antialiasing y fondo transparente */
    renderer = new THREE.WebGLRenderer({alpha:true, antialias: true});
    renderer.setSize( window.innerWidth, window.innerHeight ); // Una vez creada, la escena toma los valores alto y ancho de la ventana de navegador
    
    // Nueva CÁMARA en perspectiva - Especificamos FOV de 65º, la relación de aspecto de la ventana del navegador y los planos de corte del "frustum"
    camera = new THREE.PerspectiveCamera( 65, window.innerWidth/window.innerHeight, 0.01, 100000 );
    
    // Modificamos los valores por defecto de posición y rotación de la cámara en base a comprobar si la aplicación se lanza en móvil o escritorio
    if( !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ){  
        setDesktopCamera();
        renderer.shadowMap.enabled = true; // En escritorio, le indicamos al renderizador que active efectos de sombreado ( en móvil da problemas )
        controls = new THREE.OrbitControls( camera, renderer.domElement ); // En escritorio, inicializamos el control orbital de la cámara
        controls.noKeys = true; // Desactivamos el uso de teclado del control orbital para más comodidad
    }else{
        setMobileCamera();
    }
    
    scene = new THREE.Scene(); // Instancia del objeto de escena en Three.js
    
    // Instancia del objeto "mundo" de Oimo.js
    // Al instanciarlo sin parámetros adoptamos la configuración por defecto
    world = new OIMO.World() 
    world.gravity = new OIMO.Vec3(0, -9.8, 0); // Podemos modificar el valor de la constante gravitacional del mundo, por defecto es la misma que en la realidad. Se utiliza un vector de 3 coordenadas para establecer la dirección de la fuerza aplicada (x,y,z)
  
    document.body.appendChild( renderer.domElement ); // Agrega el elemento canvas creado por el renderizador WebGL en el DOM del documento HTML

    // ( Opcional ) Instancia y añade al DOM consola de estado de Oimo con información referente a parámetros del motor, colisiones, fps, etc...
    //oimoStats   = new THREEx.Oimo.Stats(world)
    //document.body.appendChild(oimoStats.domElement)

    // ESCUCHADORES DE EVENTOS
    window.addEventListener( 'resize', onWindowResize, false ); // Redimensionar el canvas y todo su contenido en base al tamaño de la ventana
    document.getElementById("btn-roll").onclick = function() {rollDices()}; // Botón para lanzar dados
    document.getElementById("counter").onkeyup = function(e) { // lanzar dados al pulsar enter en el input de cantidad de dados
        e.which = e.which || e.keyCode;
        if(e.which == 13) { rollDices(); }
    };  
    document.getElementById("btn-minus").onclick = function() {lessDices()}; // Botón decrementar cantidad de dados
    document.getElementById("btn-plus").onclick = function() {moreDices()}; // Botón incrementar cantidad de dados
}

/*
 * getLights() - Iluminación y sombras
 */
function getLights(){
    var ambient = new THREE.AmbientLight( 0xe1e1e1 ); // Luz ambiental
    scene.add( ambient );
    
    var directionalLight = new THREE.DirectionalLight( 0x846142, 1 ); // Luz direccional
    directionalLight.castShadow = true; // Indicamos manualmente que la luz direccional provocará la proyección de sombras
    
    // Editando el "frustum" de la luz direccional ampliamos o disminuimos el espacio en el que podrán generarse sombras
    directionalLight.position.set(-160, 160, 250);
    directionalLight.shadow.camera.right =  150;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.top =  150;
    directionalLight.shadow.camera.bottom = -150; 
    
    // (Opcional) La shadowCam es un objeto con forma de prisma trapezoidal ligado a la iluminación de tipo direccional o de foco que representa el espacio en el que pueden generarse sombras. Nos ayudará a calcular visualmente cómo podemos editar el frustum para ampliar o disminuir este "espacio de sombras"
    //shadowCam = new THREE.CameraHelper( directionalLight.shadow.camera ) 
    scene.add( directionalLight );
    //scene.add( shadowCam );
}

/*
 * loadResources() - Carga asíncrona de recursus gráficos
 */
function loadResources(){
    // Cargamos las seis imágenes de las caras del dado y creamos un array de 6 materiales del mismo tipo, cada uno con una cara, para generar un "material múltiple" ( ver comentarios en la función loadDiceTextures() más abajo )
    var dinamycM = loadDiceTextures();
    meshFaceMaterial = new THREE.MultiMaterial( dinamycM );
    
    // Cargamos las imágenes que nos servirán para generar el diffusemap y el normalmap 
    table_texture = new THREE.Texture(); // Instancia nuevo objeto three.js de tipo textura vacío
    table_normal = new THREE.Texture();
    var textureLoader = new THREE.ImageLoader();
    textureLoader.load( 'res/textures/table.jpg', function ( image ) { 
        table_texture.image = image; // Vincula la imagen con el objeto Texture una vez cargada la misma
        table_texture.needsUpdate = true; 
    });
    textureLoader.load( 'res/textures/table_n.jpg', function ( image ) { table_normal.image = image; table_normal.needsUpdate = true; });
}

/*
 * createTable() - Crea un objeto de tipo caja con una textura aplicada, simulando madera, que servirá de superficie
 */
function createTable(){
    var table_g = new THREE.BoxGeometry( 350, 350, 10 ); // Geometría de tipo caja ( altura, anchura, profundidad )
    
    // Nuevo material de tipo "Phong", que simula efectos reflectantes parecidos a los de la realidad cuando una luz incide sobre él
    var wood = new THREE.MeshPhongMaterial({
        map: table_texture, // El diffusemap o textura básica del material
        color: 0xf2f2f2, // Color básico del material, por defecto blanco 0xffffff
        normalMap: table_normal, // El normalmap es una imagen que aplica un efecto de relieve sobre la textura en base a la diferencia de color RGB. Esto hace que un modelo de baja poligonización aparente un nivel de detalle superior al que tiene realmente la malla, consiguiendo más realismo pero consumiendo menos recursos de hardware
        specular: 0xe1e1e1, // Especifica un color para el brillo del material
        shininess: 15 // Especifica intensidad de brillo del material
    })
    
    table = new THREE.Mesh( table_g, wood ); // Creamos el "mesh" o modelo especificando geometría y material
    table.rotation.x = -1.57; // Giramos el objeto en el eje x para que nos sirva de base
    table.receiveShadow = true; // Este objeto recibirá y mostrará sombras proyectadas por otros objetos que interfieran entre éste y un foco de luz
    
    // Instanciamos un objeto que representará el comportamiento de una caja sólida en el espacio físico inicializado con Oimo. Será el objeto que realmente responderá a las instrucciones que simulan gravedad y aplicación de fuerzas
    ground = THREEx.Oimo.createBodyFromMesh(world, table, false); // El parámetro booleano indica si este objeto es afectado por la gravedad. En este caso no, porque queremos que haga las veces de suelo, pero no deja de ser un objeto sólido que puede colisionar con otros objetos
    
    // Habrá que crear otro objeto "actualizador", que en la ejecución en tiempo real se encarga de sincronizar el comportamiento del objeto "físico invisible" de Oimo.js con el objeto "no físico visible" de three.js en la escena, y que ambos parezcan uno solo
    updater_g = new THREEx.Oimo.Body2MeshUpdater(ground, table);
    
    scene.add( table ); // Añadimos el objeto a al escena
}

/*
 * createWalls() - Creamos unos "muros" invisibles que contendrán los dados para que en la medida de lo posible no se salgan de la superficie y caigan la vacío. Se * crean de la misma forma que la superficie de madera, pero serán invisibles
 */
function createWalls(){
    var wall_g = new THREE.BoxGeometry( 10, 200, 350 );
    wall1 = new THREE.Mesh( wall_g, new THREE.MeshNormalMaterial() );
    wall2 = wall1.clone();
    
    wall1.position.x = -70;
    wall1.position.y = 50;
    wall2.position.y = 50;
    wall2.position.x = 0;
    wall2.position.z = -80;
    wall2.rotation.y = -1.57;
    
    wall3 = wall2.clone(); // El método clone() duplica una instancia de un "mesh" sobre otra vacía, exactamente con las mismas propiedades
    wall3.position.z = 80;
    
    wall_body1 = THREEx.Oimo.createBodyFromMesh(world, wall1, false);
    wall_body2 = THREEx.Oimo.createBodyFromMesh(world, wall2, false);
    wall_body3 = THREEx.Oimo.createBodyFromMesh(world, wall3, false);
    wall_updater1 = new THREEx.Oimo.Body2MeshUpdater(wall_body1, wall1);
    wall_updater2 = new THREEx.Oimo.Body2MeshUpdater(wall_body2, wall2);
    wall_updater3 = new THREEx.Oimo.Body2MeshUpdater(wall_body3, wall3);
    
    wall1.visible = false; // El parámetro "visible" de un mesh es un booleano que indica si ese objeto es visible o no en la escena
    wall2.visible = false;
    wall3.visible = false;
    
    scene.add( wall1 );
    scene.add( wall2 );
    scene.add( wall3 );
}
 
/*
 * loadDiceTextures() - Carga asíncrona de texturas de las caras del dado, tanto diffusemap como normalmap, devuelve un array de 6 materiales de tipo Phong que se * aplicarán sobre cada una de las caras de un dado.
 */
function loadDiceTextures(){
    var materials = [];
    
    var textureLoader = new THREE.ImageLoader();
    var dice_texture1 = new THREE.Texture();
    var dice_normal1 = new THREE.Texture();
    var dice_texture2 = new THREE.Texture();
    var dice_normal2 = new THREE.Texture();
    var dice_texture3 = new THREE.Texture();
    var dice_normal3 = new THREE.Texture();
    var dice_texture4 = new THREE.Texture();
    var dice_normal4 = new THREE.Texture();
    var dice_texture5 = new THREE.Texture();
    var dice_normal5 = new THREE.Texture();
    var dice_texture6 = new THREE.Texture();
    var dice_normal6 = new THREE.Texture();
    
    textureLoader.load( 'res/textures/1.png', function ( image ) { dice_texture1.image = image; dice_texture1.needsUpdate = true; });
    textureLoader.load( 'res/textures/1n.png', function ( image ) { dice_normal1.image = image; dice_normal1.needsUpdate = true; });
    
    textureLoader.load( 'res/textures/2.png', function ( image ) { dice_texture2.image = image; dice_texture2.needsUpdate = true; });
    textureLoader.load( 'res/textures/2n.png', function ( image ) { dice_normal2.image = image; dice_normal2.needsUpdate = true; });
    
    textureLoader.load( 'res/textures/3.png', function ( image ) { dice_texture3.image = image; dice_texture3.needsUpdate = true; });
    textureLoader.load( 'res/textures/3n.png', function ( image ) { dice_normal3.image = image; dice_normal3.needsUpdate = true; });
    
    textureLoader.load( 'res/textures/4.png', function ( image ) { dice_texture4.image = image; dice_texture4.needsUpdate = true; });
    textureLoader.load( 'res/textures/4n.png', function ( image ) { dice_normal4.image = image; dice_normal4.needsUpdate = true; });
    
    textureLoader.load( 'res/textures/5.png', function ( image ) { dice_texture5.image = image; dice_texture5.needsUpdate = true; });
    textureLoader.load( 'res/textures/5n.png', function ( image ) { dice_normal5.image = image; dice_normal5.needsUpdate = true; });
    
    textureLoader.load( 'res/textures/6.png', function ( image ) { dice_texture6.image = image; dice_texture6.needsUpdate = true; });
    textureLoader.load( 'res/textures/6n.png', function ( image ) { dice_normal6.image = image; dice_normal6.needsUpdate = true; });
    
    var diceMaterial1 = new THREE.MeshPhongMaterial({map: dice_texture1, color: 0x777777, normalMap: dice_normal1, specular: 0xffffff, shininess: 80})
    var diceMaterial2 = new THREE.MeshPhongMaterial({map: dice_texture2, color: 0x777777, normalMap: dice_normal2, specular: 0xffffff, shininess: 80})
    var diceMaterial3 = new THREE.MeshPhongMaterial({map: dice_texture3, color: 0x777777, normalMap: dice_normal3, specular: 0xffffff, shininess: 80})
    var diceMaterial4 = new THREE.MeshPhongMaterial({map: dice_texture4, color: 0x777777, normalMap: dice_normal4, specular: 0xffffff, shininess: 80})
    var diceMaterial5 = new THREE.MeshPhongMaterial({map: dice_texture5, color: 0x777777, normalMap: dice_normal5, specular: 0xffffff, shininess: 80})
    var diceMaterial6 = new THREE.MeshPhongMaterial({map: dice_texture6, color: 0x777777, normalMap: dice_normal6, specular: 0xffffff, shininess: 80})
    
    materials.push(diceMaterial1);
    materials.push(diceMaterial6);
    materials.push(diceMaterial3);
    materials.push(diceMaterial4);
    materials.push(diceMaterial5);
    materials.push(diceMaterial2);

    return materials;
}
 
/*
 * moreDices() - Función asociada a escuchador de evento de tipo click. Incrementa el valor numérico del input
 */
function moreDices() {
    document.getElementById("counter").value = parseInt(document.getElementById("counter").value)+1;
}
/*
 * lessDices() - Función asociada a escuchador de evento de tipo click. Decrementa el valor numérico del input
 */
function lessDices() {
    if(parseInt(document.getElementById("counter").value) > 0){
       document.getElementById("counter").value = parseInt(document.getElementById("counter").value)-1;
    }  
}

/*
 * rollDices() - Genera dinámicamente un número variable de dados en el escenario, con posición, rotación y fuerza aplicada aleateorias
 */
function rollDices() {

  var curr_value = parseInt(document.getElementById("counter").value) // Obtiene el valor del input y lo pasa a un entero
 
  // Si no es la primera vez que pulsamos el botón, hay que eliminar todos los dados del escenario y sus instancias antes de hacer una nueva tirada
  for ( var i =0 ; i < dices.length; i++ ){
      scene.remove( dices[i].mesh ); // Elimina los modelos del escenario three.js
      dices[i].body.remove(); // Elimina los "cuerpos físicos no visibles" el entorno de Oimo.js
  }
 
  dices = []; // Vacía el array

 var dice_g = new THREE.BoxGeometry( 15, 15, 15, 10, 10 ); // Nueva geometría de tipo caja para el dado
    
 for ( var i =0 ; i < curr_value; i++ ){ // Creamos una cantidad de dados equivalente al entero recogido en el input
     
     var dice = {}; // Introduciremos cada instancia como parámetros de un objeto padre para hacerlo más accesible
     
     dice['mesh'] = new THREE.Mesh( dice_g, meshFaceMaterial ); // El parámetro "mesh" contendrá un objeto de tipo "mesh" con la geometría y el material múltiple con las seis caras del dado ( diffuse + normal ) 
     
     // Establecemos posición y rotación aleatoria, dentro de rangos más o menos razonables
     dice['mesh'].position.y = Math.floor(Math.random() * 50) + 20;
     dice['mesh'].position.z = Math.floor(Math.random() * 80) + 0;
     dice['mesh'].position.x = 120;
     dice['mesh'].rotation.x = Math.floor(Math.random() * 5) + -1;
     dice['mesh'].rotation.y = Math.floor(Math.random() * 5) + -1;
     dice['mesh'].rotation.z = Math.floor(Math.random() * 5) + -1;

     dice['body'] = THREEx.Oimo.createBodyFromMesh(world, dice['mesh']); // El parámetro "body" contendrá el objeto de Oimo.js que aplicará efectos de física sobre el dado
     dice['updater'] = new THREEx.Oimo.Body2MeshUpdater(dice['body'], dice['mesh']); // El parámetro "updater" contendrá el objeto actualizador de Oimo.js que sincronizará el modelo three.js con el objeto Oimo.js

     dices.push(dice); // Añadimos el nuevo objeto padre a un array de dados
     scene.add( dice['mesh'] ); // Añadimos el mesh a la escena three.js
     dice['mesh'].castShadow = true; // El mesh podrá proyectar sombras sobre un objeto si interfiere entre este y un foco de luz, en nuestro caso, la superficie de madera

     // Aplicamos fuerzas aleatorias dentro de rangos más o menos razonables en los tres ejes (x,y,z), procurando evitar que los dados caigan al vacío
     dice['body'].body.linearVelocity.x	= Math.floor(Math.random() * -3) + 0;
     dice['body'].body.linearVelocity.y	= Math.floor(Math.random() * 3) + 1;
     dice['body'].body.linearVelocity.z	= Math.floor(Math.random() * -2) + 0;
 }

}

/*
 * setMobileCamera() - Establece posición y rotación de cámara adaptada para navegador web en teléfono móvil en posición vertical o "portrait"
 */
function setMobileCamera(){
    camera.position.x = 35.886102807411916;
    camera.position.y = 190.04975021633638;
    camera.position.z = -3.2434291032492784;
    camera.rotation.x = -1.5707963346557643;
    camera.rotation.y = 9.999992016675453e-7;
    camera.rotation.z = 1.5700131792566352;
}
   
/*
 * setDesktopCamera() - Establece posición y rotación de cámara adaptada para navegador web en escritorio
 */
function setDesktopCamera(){
    camera.position.x = 166.02148480935125;
    camera.position.y = 135.74195280238132;
    camera.position.z = -3.1301728572653835;
    camera.rotation.x = -1.5730759812820272;
    camera.rotation.y = 0.608447029537074;
    camera.rotation.z = 1.5747845853517015;
}
   
/*
 * onWindowResize() - Llamamos a esta función cada vez que el usuario redimensiona la pantalla, ajustando el tamaño del renderizador y la cámara
 */
function onWindowResize() {
  //Modificamos uno de los parámetros iniciales de la cámara, la relación de aspecto, al valor del cociente ancho/alto que tengamos en cada momento que el tamaño de la ventana cambia
  camera.aspect = window.innerWidth / window.innerHeight;
  // Actualizamos los valores de la matriz de proyección de la cámara, se trata de un vector de cuatro dimensiones que el renderizador necesita para realizar cálculos complejos.
  camera.updateProjectionMatrix();
  //Modificamos los valores de dimensión del renderizador cada vez que el usuario modifica el tamaño de la ventana
  renderer.setSize( window.innerWidth, window.innerHeight );
}