const body = document.body;
const content = document.querySelector(".content");

const reloadBtn = document.getElementById("reloadBtn");

const fileBtn = document.getElementById("fileBtn");
const fileName = document.getElementById("fileName");
let appName = "";
let nbFile = "";
let evaluatorName = "";

const framePlaceholder = document.getElementById("frame-placeholder");
const ctx = framePlaceholder.getContext("2d");
let savedFrame = null;

const researcherInfo = document.getElementById("researcherInfo");
const submitBtn = document.getElementById("submitBtn");
const sidebar = document.getElementById("sidebar");
const blocks = document.querySelectorAll(".block");

const zones = document.querySelectorAll('input[name="zone"]');
let selectedZone = zones[0].value;
const structures = document.querySelectorAll(".structure-item");
let selectedStructure = null;
const sliders = document.querySelectorAll('.brush-slider');
const  widths = Array.from(document.querySelectorAll(".brush-slider")).map(slider => parseInt(slider.value));
const colors = Array.from(document.querySelectorAll(".structure-item")).map(div => div.dataset.color);
const deleteDrawings = document.querySelectorAll(".delete");
let drawing = false;
let trazos = [];
let trazoActual = null;


/*Botones reload y home:

*/
/*-------------------------BOTONES LOGOUT Y HOME-------------------------*/
reloadBtn.addEventListener("click", () => {
    location.reload();
})

/*Comenzar:
- Se muestra el nombre de la primera imagen no evaluada.
- Se carga la imagen.
*/
/*-------------------------COMENZAR-------------------------*/
//Se abre el díalogo al hacer click sobre select video
document.addEventListener("DOMContentLoaded", () =>{
    evaluatorName = researcherInfo.dataset.user;
    imagen_evaluada = sessionStorage.getItem('imagen');

});

fileBtn.textContent = "Start";
fileName.textContent = "No image shown.";
fileBtn.addEventListener("click", () => {
    getImage();
    sidebar.classList.remove("hidden");
    qualityGreen.classList.add("hidden");
    qualityYellow.classList.add("hidden");
    qualityRed.classList.add("hidden");
    qualityBlack.classList.add("hidden");
    submitBtn.classList.remove("hidden");
    content.style.marginRight = "21vw";

});

async function getImage(){
    const res = await fetch(`/select/${appName}`);
    if (!res.ok) {
        alert("Error loading list of videos");
        return;
    }
    const images = await res.json();

    //Comprobar que no se haya analizado ya la imagen (BACKEND)

    const img = new Image();
    img.src = ''; //recibida del backend
    img.onload = function() {
        ctx.drawImage(img, 0, 0, framePlaceholder.width, framePlaceholder.height);
        savedFrame = ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height);

    };
};



/*Sidebar:
- Al seleccionar una estructura, se activa el brush correspondiente, permitiendo dibujar.
- El tamaño del brush se puede ajustar con un slider.
- Cada estructura tiene un botón para borrar el trazo correspondiente.
- Cuando se ha completado el formulario, se puede enviar.
*/
/*-------------------------SIDEBAR-------------------------*/
//Al seleccionar una zona, se muestran las estructuras correspondientes. Si no hay una zona seleccionada, se selecciona la primera por defecto.
function showStructures(selectedZone){
    activeStructures = document.querySelectorAll(`.${selectedZone}-structure-item`);
    activeStructures.forEach(structure => {
        structure.classList.remove("hidden");
        structure.classList.add("transparent");
    });
    selectedStructure = activeStructures[0];
    const firstIndex = selectedStructure.querySelector('.brush-slider');
    currentIndex = Array.from(sliders).indexOf(firstIndex); //Actualizar el color cuando se cambia la zona
    selectedStructure.classList.remove("transparent");
    activeStructures.forEach(structure => {
        structure.addEventListener('click', (event) => {
            structures.forEach(structure => {
                structure.classList.add("transparent");
            });
            selectedStructure = event.currentTarget;
            selectedStructure.classList.remove("transparent");
        });
    });
}
showStructures(selectedZone);
zones.forEach(zone => {
    zone.addEventListener('change', (event) => {
        structures.forEach((structure) => {
            structure.classList.add("hidden");
            clearDrawing();
        });
        selectedZone = event.target.value;
        showStructures(selectedZone);
    });
});


//Al seleccionar una estructura, se activa la misma y se accede al brush correspondiente.
structures.forEach((structure, index) => {
    structure.addEventListener('click', () => {
        widths[index] = parseInt(sliders[index].value);
        currentIndex = index;
    });
});
sliders.forEach((slider, index) => {
    slider.addEventListener('input', () => {
        widths[index] = parseInt(slider.value);
    });
});
deleteDrawings.forEach((deleteButton, index) => {
    deleteButton.addEventListener('click', () => {
        clearColorDrawing(colors[index]);
    });
});

//Dibujos con los brush
framePlaceholder.addEventListener('mousedown', startDrawing);
framePlaceholder.addEventListener('mousemove', draw);
framePlaceholder.addEventListener('mouseup', stopDrawing);
framePlaceholder.addEventListener('mouseleave', stopDrawing);
framePlaceholder.addEventListener('touchstart', startDrawing);
framePlaceholder.addEventListener('touchmove', draw);
framePlaceholder.addEventListener('touchend', stopDrawing);
framePlaceholder.addEventListener('touchcancel', stopDrawing);

function startDrawing(e) {
    drawing = true;
    trazoActual = {color: colors[currentIndex], width: widths[currentIndex], puntos: []};
    draw(e);
}
function stopDrawing() {
    if(trazoActual) {
        trazos.push(trazoActual);
        trazoActual = null;
    }
        validar();
    drawing = false;
    ctx.beginPath();
}

function draw(e) {
    if (!drawing) return;
    e.preventDefault();

    const color = colors[currentIndex];
    const width = widths[currentIndex];
    let pos;
    if (e.type.includes('mouse')) {
        pos = getMousePos(framePlaceholder, e);
    } else {
        pos = getTouchPos(framePlaceholder, e);
    }
    trazoActual.puntos.push(pos);
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left)/rect.width*canvas.width,
        y: (evt.clientY - rect.top)/rect.height*canvas.height
    };
}
function getTouchPos(canvas, touch) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (touch.touches[0].clientX - rect.left)/rect.width*canvas.width,
        y: (touch.touches[0].clientY - rect.top)/rect.height*canvas.height
    };
}

//Borrar el trazo correspondiente
function clearColorDrawing(colorDelete) {
    trazos = trazos.filter(trazo => trazo.color !== colorDelete);
    redrawRest(colorDelete);
}
function redrawRest(colorDelete=null) {
    ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
    ctx.putImageData(savedFrame, 0, 0);
    trazos.forEach(trazo => {
        if (!colorDelete || trazo.color !== colorDelete) {
            ctx.lineWidth = trazo.width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = trazo.color;
            for (let i = 1; i < trazo.puntos.length; i++) {
                const punto1 = trazo.puntos[i-1];
                const punto2 = trazo.puntos[i];
                ctx.beginPath();
                ctx.moveTo(punto1.x, punto1.y);
                ctx.lineTo(punto2.x, punto2.y);
                ctx.stroke();
            }
            ctx.beginPath();
        }
    });
    validar();
}
//Borrar todos los trazos si se selecciona otra zona.
function clearDrawing() {
    ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
    ctx.putImageData(savedFrame, 0, 0);
    trazos = [];
    validar();
}

//Formulario completado, validar y enviar (frame editado, filename, evaluator)
function validar() {
    const activeColors = Array.from(structures).map(s => s.querySelector('.brush-slider').style.accentColor);
    const allColorsDrawn = activeColors.every(color =>
        trazos.some(trazo => trazo.color === color && trazo.puntos.length > 0)
    );
    if (allColorsDrawn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("disabled");
        submitted = true;
    }
    else{
        submitBtn.disabled = true;
        submitBtn.classList.add("disabled");
        submitted = false;
    }
}

submitBtn.addEventListener("click", () => { saveDrawing();});

function saveDrawing(){
    let objectJS = [];
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');

    const maskEditedCanvas = document.createElement('canvas');
    const maskEditedCtx = maskEditedCanvas.getContext('2d');
    maskEditedCanvas.width = framePlaceholder.width;
    maskEditedCanvas.height = framePlaceholder.height;
    maskEditedCtx.drawImage(framePlaceholder, 0, 0);
    const imageEditedURL = maskEditedCanvas.toDataURL();

    const maskOriginalCanvas = document.createElement("canvas");
    const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
    maskOriginalCanvas.width = savedFrame.width;
    maskOriginalCanvas.height = savedFrame.height;
    maskOriginalCtx.putImageData(savedFrame, 0, 0);
    const imageURL = maskOriginalCanvas.toDataURL();
    objectJS = {
        image: fileName.textContent, 
        imageEdited: imageEditedURL,
        filesaved: `rm_${timestamp}.png`,
        evaluator: evaluatorName
    };

    fetch('/saveRM', { //MODIFICAR BACKEND
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objectJS)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Drawing saved successfully:', data);
        alert('Drawing saved successfully.');
        recargarVideo(appName, fileName.textContent);
    })
    .catch(error => {
        console.error('Error saving drawing:', error);
        alert('An error occurred while saving. Please try again.');
    });
}

function recargarVideo(filename){
    // Guardar datos para usar después de la recarga: nombre de la imagen evaluada
    sessionStorage.setItem('imagen', filename);

    location.reload();
}