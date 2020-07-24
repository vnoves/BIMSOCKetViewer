//Load customized Json file
var loadedModels = [];
function loadModel(modelName) {
    var loader = new THREE.ObjectLoader();
    var loadedModel = {name : modelName};
    var oldModel = undefined;
    // Get model from firebase for the first time
    db.collection('models').doc(modelName).get().then(function(doc) {
        if (doc.exists) {
            model = doc.data();
            
            loader.parse(model,
                function (mod) {
                    // console.log(mod);
                    modelObj = mod;
                    console.log(modelObj);
                    loadedModel.model = modelObj;
                    mod.castShadow = true;
        
                    //Adjust the camera location to the max bouding from object
                    var bbox = new THREE.Box3().setFromObject(mod);
                    var maxObjectDistance = Math.max(bbox.max.z, bbox.max.x, bbox.max.y);
                    camera.position.z = maxObjectDistance
                    camera.position.x = bbox.max.x;
                    camera.position.y = bbox.max.y;
            
                    //Adjust the camera near plane and max/min zoom for controls
                    var averageSizes = ((bbox.max.z + bbox.max.x +  bbox.max.y)/3)*0.01;
                    camera.near = averageSizes;
                    controls.minDistance = averageSizes*1.2;
                    controls.maxDistance = maxObjectDistance*4;
                    camera.updateProjectionMatrix();
                    
                    scene.add(mod);  
                    oldModel = mod;
                    loadedModel.scene = mod;       
                }
            );
        } else {
            console.log("No such document!");
        }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
 
    // Subscribe on update changes for model on firebase
    
    var unsuscribe = db.collection('models').doc(modelName).onSnapshot((modelChanges) => {
        model = modelChanges.data();
        loader.parse(model,
            function (mod) {
                scene.children.forEach(element => {
                    if (element.name == mod.name){
                        scene.remove(element);
                        console.log("updating model " + modelName);
                        mod.castShadow = true;
                        scene.add(mod);  
                        lastMod = mod;
                    }
 
                    });
                    
            }
        ); 
    });
    loadedModel.unsuscribe = unsuscribe;
    loadedModels.push(loadedModel);
}


 
function unloadModel(_modelName){
    loadedModels.forEach(function(modelScene){
        if (modelScene.name =_modelName ){
            scene.children.forEach(element => {
                if (element.name.includes(_modelName) ){ //Hard coded possible error in the future
                    scene.remove(element);
 
                }
 
                });
            modelScene.unsuscribe();
            console.log("Removing model " + _modelName);
        }
    })
}

async function getModelsNames() {
    var dbName = 'models';
    const snapshot = await firebase.firestore().collection(dbName).get();
    return snapshot.docs.map(doc => doc.ref.path.replace(dbName + "/" , ""));
}
