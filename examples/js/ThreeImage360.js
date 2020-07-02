
function add360Image(scene, path) {
    var geometry = new THREE.SphereBufferGeometry( 500, 60, 40 );
    geometry.scale( - 1, 1, 1 );

    var texture = new THREE.TextureLoader().load( path );
    var material = new THREE.MeshBasicMaterial( { map: texture } );

    var mesh = new THREE.Mesh( geometry, material );

    scene.add( mesh );
}
