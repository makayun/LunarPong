    BABYLON.DefaultLoadingScreen.prototype.displayLoadingUI = function () {
		if (this._loadingDiv) {
			return;
		}
		this._loadingDiv = document.createElement("div");
		this._loadingDiv.id = "babylonjsLoadingDiv";
		this._loadingDiv.style.opacity = "0";
		this._loadingDiv.style.transition = "opacity 2.5s ease";
		this._loadingDiv.style.pointerEvents = "none";
		// Generating keyframes
		var style = document.createElement('style');
		style.type = 'text/css';
		document.getElementsByTagName('head')[0].appendChild(style);
		// Loading GIF
		var imgBack = new Image();

		//
		imgBack.style.position = "absolute";
		imgBack.style.top = "50%";
		imgBack.style.left = "50%";
        imgBack.style.maxWidth = "100%";
        imgBack.style.maxHeight = "100%";
		imgBack.style.transform = "translate(-50%, -50%)";
		imgBack.src = "https://images.idgesg.net/images/article/2018/11/google-maps-chicago-100780535-large.jpg";






		this._loadingDiv.appendChild(imgBack);
		this._resizeLoadingUI();
		window.addEventListener("resize", this._resizeLoadingUI);
		this._loadingDiv.style.backgroundColor = "#077fb3";
		this._loadingDivBackgroundColor = "#077fb3";
		document.body.appendChild(this._loadingDiv);
		this._loadingDiv.style.opacity = "1";
	};
var delayCreateScene = function () {
    // Create a scene.
    var scene = new BABYLON.Scene(engine);

    // Create a default skybox with an environment.
    var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/environment.dds", scene);
    var currentSkybox = scene.createDefaultSkybox(hdrTexture, true);

    // Append glTF model to scene.
    BABYLON.SceneLoader.Append("scenes/BoomBox/", "BoomBox.gltf", scene, function (scene) {
        // Create a default arc rotate camera and light.
        scene.createDefaultCameraOrLight(true, true, true);

        // The default camera looks at the back of the asset.
        // Rotate the camera by 180 degrees to the front of the asset.
        scene.activeCamera.alpha += Math.PI;
        setTimeout(() => {

    scene.getEngine().displayLoadingUI()
        }, 5000)
    });






    return scene;
};
