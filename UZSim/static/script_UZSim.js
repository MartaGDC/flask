const body = document.body;
const downloadBtn = document.getElementById("downloadBtn");

const cuerpo = document.getElementById("cuerpo");
const buttonContainer = document.getElementById("buttonContainer");
const btnEco = document.getElementById("btnEco");
const btnFisio = document.getElementById("btnFisio");
const btnPatol = document.getElementById("btnPatol");
const btnSimFisio = document.getElementById("btnSimFisio");
const btnSimPatol = document.getElementById("btnSimPatol");
let proyectoSeleccionado = '';

const content = document.getElementById("content");
const zonasCuerpo = document.getElementById("zonasCuerpo");
const windowZona = document.getElementById("windowZona");
const btnAddZona = document.getElementById("btnAddZona");
const newZone = document.getElementById("newZone");
const btnAceptarNuevaZona = document.getElementById("btnAceptarNuevaZona");
const btnCancelarNuevaZona = document.getElementById("btnCancelarNuevaZona");
let zonaSeleccionada = "";

const windowCortes = document.getElementById("windowCortes");
const cortesDisponibles = document.getElementById("cortesDisponibles");
const windowNewCorte = document.getElementById("windowNewCorte");
const btnAddCorte = document.getElementById("btnAddCorte");
const newCorte = document.getElementById("newCorte");
const btnAceptarNuevoCorte = document.getElementById("btnAceptarNuevoCorte");
const btnCancelarNuevoCorte = document.getElementById("btnCancelarNuevoCorte");
let corteSeleccionado="";

const windowEstructura = document.getElementById("windowEstructura");
const estructuraDisponibles = document.getElementById("estructuraDisponibles");
const windowNewEstructura = document.getElementById("windowNewEstructura");
const btnAddEstructura = document.getElementById("btnAddEstructura");
const newEstructura = document.getElementById("newEstructura");
const btnAceptarNuevaEstructura = document.getElementById("btnAceptarNuevaEstructura");
const btnCancelarNuevaEstructura = document.getElementById("btnCancelarNuevaEstructura");
let estructuraSeleccionada="";

const windowPatologia = document.getElementById("windowPatologia");
const patologiaDisponibles = document.getElementById("patologiaDisponibles");
const windowNewPatologia = document.getElementById("windowNewPatologia");
const btnAddPatologia = document.getElementById("btnAddPatologia");
const newPatologia = document.getElementById("newPatologia");
const btnAceptarNuevaPatologia = document.getElementById("btnAceptarNuevaPatologia");
const btnCancelarNuevaPatologia = document.getElementById("btnCancelarNuevaPatologia");
let patologiaSeleccionada="";

const windowOrientacion = document.getElementById("windowOrientacion");
const orientacionDisponibles = document.getElementById("orientacionDisponibles");
const windowNewOrientacion = document.getElementById("windowNewOrientacion");
const btnAddOrientacion = document.getElementById("btnAddOrientacion");
const newOrientacion = document.getElementById("newOrientacion");
const btnAceptarNuevaOrientacion = document.getElementById("btnAceptarNuevaOrientacion");
const btnCancelarNuevaOrientacion = document.getElementById("btnCancelarNuevaOrientacion");
let orientacionSeleccionada="";

const windowExploracion = document.getElementById("windowExploracion");
const exploracionDisponibles = document.getElementById("exploracionDisponibles");
const windowNewExploracion = document.getElementById("windowNewExploracion");
const btnAddExploracion = document.getElementById("btnAddExploracion");
const newExploracion = document.getElementById("newExploracion");
const btnAceptarNuevaExploracion = document.getElementById("btnAceptarNuevaExploracion");
const btnCancelarNuevaExploracion = document.getElementById("btnCancelarNuevaExploracion");
let exploracionSeleccionada="";

let images = [];
const mapaWindow = document.getElementById("mapaWindow");
const titleMapa = document.getElementById("titleMapa");
const mapaFileInput = document.getElementById("mapaFileInput");
const mapaText = document.getElementById("mapaText");
let mapaSeleccionado = null;
const mascaraFileInput = document.getElementById("mascaraFileInput");
const listaMascaras = document.getElementById("listaMascaras");
let mascarasSeleccionadas = [];
let nombreMascaras = [];
const contenedorVideo = document.getElementById("contenedorVideo");
const videoFileInput = document.getElementById("videoFileInput");
const videoText = document.getElementById("videoText");
let videoSeleccionado = null;
const btnAceptarImg = document.getElementById("btnAceptarImg");
const btnCancelarImg = document.getElementById("btnCancelarImg");

const warningMapa = document.getElementById("warningMapa");
const btnWarn = document.getElementById("btnWarn");


//Seleccion apartado
async function selectOption(option) {
    if (option === 'CAR') {
        proyectoSeleccionado = option;
        await createProyecto(option);
        buttonContainer.style.display = "none";
        cuerpo.style.display = "flex";
        cuerpo.style.flexDirection = "column";
        cuerpo.style.justifyContent = "start";
        cuerpo.style.alignItems = "start";
        content.style.display = "block";
    }

    else if (option === 'CERF') {
        proyectoSeleccionado = option;
        await createProyecto(option);
        buttonContainer.style.display = "none";
        cuerpo.style.display = "flex";
        cuerpo.style.flexDirection = "column";
        cuerpo.style.justifyContent = "start";
        cuerpo.style.alignItems = "start";
        content.style.display = "block";
    }

    else if (option === 'CERP') {
        proyectoSeleccionado = option;
        await createProyecto(option);
        buttonContainer.style.display = "none";
        cuerpo.style.display = "flex";
        cuerpo.style.flexDirection = "column";
        cuerpo.style.justifyContent = "start";
        cuerpo.style.alignItems = "start";
        content.style.display = "block";
    }

    else if (option === 'SF') {
        proyectoSeleccionado = option;
        await createProyecto(option);
        buttonContainer.style.display = "none";
        cuerpo.style.display = "flex";
        cuerpo.style.flexDirection = "column";
        cuerpo.style.justifyContent = "start";
        cuerpo.style.alignItems = "start";
        content.style.display = "block";
    }
    else {
        proyectoSeleccionado = option;
        await createProyecto(option);
        buttonContainer.style.display = "none";
        cuerpo.style.display = "flex";
        cuerpo.style.flexDirection = "column";
        cuerpo.style.justifyContent = "start";
        cuerpo.style.alignItems = "start";
        content.style.display = "block";
    }
}


//------------------APRENDIZAJE FISIO------------------

//------------------UX------------------
document.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!windowZona.contains(e.target) 
        && !windowNewCorte.contains(e.target)
        && !windowNewEstructura.contains(e.target)
        && !windowNewPatologia.contains(e.target)
        && !windowNewOrientacion.contains(e.target)
        && !windowNewExploracion.contains(e.target)
        && !mapaWindow.contains(e.target)
        && !warningMapa.contains(e.target)) {
        closeAllPanels();
    }
});

function closeAllPanels() {
    windowZona.classList.add("hidden");
    windowCortes.classList.add("hidden");
    windowNewCorte.classList.add("hidden");
    windowEstructura.classList.add("hidden");
    windowNewEstructura.classList.add("hidden");
    windowPatologia.classList.add("hidden");
    windowNewPatologia.classList.add("hidden");
    windowOrientacion.classList.add("hidden");
    windowNewOrientacion.classList.add("hidden");
    windowExploracion.classList.add("hidden");
    windowNewExploracion.classList.add("hidden");
    mapaWindow.style.display = "none";
    warningMapa.classList.add('hidden');
    const btnAddZona = document.getElementById("btnAddZona");
    if (btnAddZona) {
        btnAddZona.disabled=false;
        btnAddZona.classList.remove("disabled", "active");
    }
    const btnAddCorte = document.getElementById("btnAddCorte");
    if (btnAddCorte) {
        btnAddCorte.disabled=false;
        btnAddCorte.classList.remove("disabled", "active");
    }
    const btnAddEstructura = document.getElementById("btnAddEstructura");
    if(btnAddEstructura) {
        btnAddEstructura.disabled = false;
        btnAddEstructura.classList.remove("disabled", "active");
    }
    const btnAddPatologia = document.getElementById("btnAddPatologia");
    if(btnAddPatologia) {
        btnAddPatologia.disabled = false;
        btnAddPatologia.classList.remove("disabled", "active");
    }
    const btnAddOrientacion = document.getElementById("btnAddOrientacion");
    if (btnAddOrientacion) {
        btnAddOrientacion.disabled=false;
        btnAddOrientacion.classList.remove("disabled", "active");
    }
    const btnAddExploracion = document.getElementById("btnAddExploracion");
    if (btnAddExploracion) {
        btnAddExploracion.disabled=false;
        btnAddExploracion.classList.remove("disabled", "active");
    }
    zonasCuerpo.querySelectorAll("div").forEach(el => {
        el.classList.remove("disabled");
        el.disabled = false;
        el.style.background = "transparent";
        el.style.color = "#4B5563";
    });
    cortesDisponibles.querySelectorAll("div")?.forEach(el => {
        el.classList.remove("disabled");
        el.disabled = false;
        el.style.background = "transparent";
        el.style.color = "#4B5563";
    });
    estructuraDisponibles.querySelectorAll("div")?.forEach(el => {
        el.classList.remove("disabled");
        el.disabled = false;
        el.style.background = "transparent";
        el.style.color = "#4B5563";
    });
    patologiaDisponibles.querySelectorAll("div")?.forEach(el => {
        el.classList.remove("disabled");
        el.disabled = false;
        el.style.background = "transparent";
        el.style.color = "#4B5563";
    });
    orientacionDisponibles.querySelectorAll("div")?.forEach(el => {
        el.classList.remove("disabled");
        el.disabled = false;
        el.style.background = "transparent";
        el.style.color = "#4B5563";
    });
    exploracionDisponibles.querySelectorAll("div")?.forEach(el => {
        el.classList.remove("disabled");
        el.disabled = false;
        el.style.background = "transparent";
        el.style.color = "#4B5563";
    });
    zonaSeleccionada = '';
    corteSeleccionado = '';
    estructuraSeleccionada = '';
    patologiaSeleccionada = '';
    orientacionSeleccionada = '';
    exploracionSeleccionada = '';
    mapaSeleccionado = null;
    videoSeleccionado = null;
    mascarasSeleccionadas = [];
}

function desactivarEl(contenedor, boton)  {
    contenedor.querySelectorAll("div").forEach(el => {
        el.style.background = "transparent";
        el.style.color = "#4B5563";
        el.classList.add("disabled");
        el.disabled =true;
        boton.disabled=true;
        boton.classList.add("disabled");
    })
}
function activarEl(contenedor)  {
    contenedor.querySelectorAll("div").forEach(el => {
        el.style.background = "transparent";
        el.style.color = "#4B5563";
        el.classList.remove("disabled");
        el.disabled =false;
    })
}


btnEco.onclick = async () => {
    await selectOption('CAR');
    rellenarZonas();
}

btnFisio.onclick = async () => {
    await selectOption('CERF');
    rellenarZonas();
}

btnPatol.onclick = async () => {
    await selectOption('CERP');
    rellenarZonas();
}

btnSimFisio.onclick = async () => {
    await selectOption('SF');
    rellenarZonas();
}

btnSimPatol.onclick = async () => {
    await selectOption('SP');
    rellenarZonas();
}



async function rellenar({window, api, tablaHTML, onSelect, addButtonId, input}) {
    const res = await fetch(api);
    if (!res.ok) {
        alert("Error loading list");
        return;
    }
    const items = await res.json();
    tablaHTML.innerHTML = "";
    items.forEach(item => {
        const div = document.createElement("div");
        div.textContent = item;
        div.style.cursor = "pointer";
        div.addEventListener("click", async (e) => {
            e.stopPropagation();
            desactivarEl(tablaHTML, btnAdd);
            div.style.background = "#14b8a6";
            div.style.color = "#1f2937"
            div.classList.remove("disabled");
            await onSelect(item);
        });
        tablaHTML.appendChild(div);
    });
    const btnAdd = document.createElement("button");

    btnAdd.id = addButtonId;
    btnAdd.textContent = "Añadir";
    btnAdd.addEventListener("click", (e) => {
        e.stopPropagation();
        desactivarEl(tablaHTML, btnAdd);
        btnAdd.classList.add("active");
        btnAdd.classList.remove("disabled");
        window.classList.remove("hidden");
        input.focus();
    });
    tablaHTML.appendChild(btnAdd);
}

//-----------Zonas-----------
async function rellenarZonas () {
    rellenar({
        window: windowZona,
        api: `/api/zonas?proyecto=${proyectoSeleccionado}`,
        tablaHTML: zonasCuerpo,
        onSelect: async(zona) => {
            zonaSeleccionada = zona;
            if(proyectoSeleccionado != 'CAR'){
                rellenarCortes();
            }
            else{
                mostrarSelecciones();
            }
        },
        addButtonId: "btnAddZona",
        input: newZone
    });
}

btnAceptarNuevaZona.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newZone.value == '') return;
    await createZone(newZone.value);
    newZone.value = '';
    windowZona.classList.add("hidden");
    await rellenarZonas();
});
windowZona.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnAceptarNuevaZona.click();
    }
});

btnCancelarNuevaZona.addEventListener('click', (e) => {
    e.stopPropagation();
    windowZona.classList.add("hidden");
    const btnAddZona = document.getElementById("btnAddZona");
    btnAddZona.classList.remove("active");
    activarEl(zonasCuerpo);
});


//-----------Cortes-----------
async function rellenarCortes () {
    windowCortes.classList.remove("hidden");
    rellenar({
        window: windowNewCorte,
        api: `/api/cortes?zona=${zonaSeleccionada}&proyecto=${proyectoSeleccionado}`,
        tablaHTML: cortesDisponibles,
         onSelect: async(corte) => {
            corteSeleccionado = corte;
            if(proyectoSeleccionado == 'SF' || proyectoSeleccionado =='SP' || proyectoSeleccionado =='CERP'){
                rellenarEstructura();
            }
            else if (proyectoSeleccionado == 'CERF') {
                rellenarOrientacion();
            }
            else{
                mostrarSelecciones();
            }
        },
        addButtonId: "btnAddCorte",
        input: newCorte
    });
}

btnAceptarNuevoCorte.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newCorte.value == '') return;
    await createCorte(proyectoSeleccionado, newCorte.value, zonaSeleccionada);
    newCorte.value = '';
    windowNewCorte.classList.add("hidden");
    await rellenarCortes();
});
windowCortes.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnAceptarNuevoCorte.click();
    }
});

btnCancelarNuevoCorte.addEventListener('click', (e) => {
    e.stopPropagation();
    windowNewCorte.classList.add("hidden");
    const btnAddCorte = document.getElementById("btnAddCorte");
    btnAddCorte.classList.remove("active");
    activarEl(cortesDisponibles);
});



//-----------Estructura-----------
async function rellenarEstructura() {
    windowEstructura.classList.remove("hidden");
    rellenar({
        window: windowNewEstructura,
        api: `/api/estructuras?zona=${zonaSeleccionada}&corte=${corteSeleccionado}&proyecto=${proyectoSeleccionado}`,
        tablaHTML: estructuraDisponibles,
         onSelect: async(estructura) => {
            estructuraSeleccionada = estructura;
            if(proyectoSeleccionado == 'SF'){
                rellenarOrientacion();
            }
            else {
                rellenarPatologia();
            }
        },
        addButtonId: "btnAddEstructura",
        input: newEstructura
    });
}

btnAceptarNuevaEstructura.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newEstructura.value == '') return;
    await createEstructura(proyectoSeleccionado, corteSeleccionado, zonaSeleccionada, newEstructura.value);
    windowNewEstructura.classList.add("hidden");
    await rellenarEstructura();
});
windowEstructura.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnAceptarNuevaEstructura.click();
    }
});

btnCancelarNuevaEstructura.addEventListener('click', (e) => {
    e.stopPropagation();
    windowNewEstructura.classList.add("hidden");
    const btnAddEstructura = document.getElementById("btnAddEstructura");
    btnAddEstructura.classList.remove("active");
    activarEl(estructuraDisponibles);

});


//-----------Orientacion-----------
async function rellenarOrientacion() {
    windowOrientacion.classList.remove("hidden");
    rellenar({
        window: windowNewOrientacion,
        api: `/api/orientaciones?zona=${zonaSeleccionada}&corte=${corteSeleccionado}&estructura=${estructuraSeleccionada}&patologia=${patologiaSeleccionada}&exploracion=${exploracionSeleccionada}&proyecto=${proyectoSeleccionado}`,
        tablaHTML: orientacionDisponibles,
         onSelect: async(orientacion) => {
            orientacionSeleccionada = orientacion;
            mostrarSelecciones();
        },
        addButtonId: "btnAddOrientacion",
        input: newOrientacion
    });
}

btnAceptarNuevaOrientacion.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newOrientacion.value == '') return;
    await createOrientacion(proyectoSeleccionado, corteSeleccionado, zonaSeleccionada, estructuraSeleccionada, newOrientacion.value, patologiaSeleccionada, exploracionSeleccionada);
    newOrientacion.value = '';
    windowNewOrientacion.classList.add("hidden");
    await rellenarOrientacion();
});
windowOrientacion.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnAceptarNuevaOrientacion.click();
    }
});

btnCancelarNuevaOrientacion.addEventListener('click', (e) => {
    e.stopPropagation();
    windowNewOrientacion.classList.add("hidden");
    const btnAddOrientacion = document.getElementById("btnAddOrientacion");
    btnAddOrientacion.classList.remove("active");
    activarEl(orientacionDisponibles);

});


//-----------Patologia-----------
async function rellenarPatologia() {
    windowPatologia.classList.remove("hidden");
    rellenar({
        window: windowNewPatologia,
        api: `/api/patologias?zona=${zonaSeleccionada}&corte=${corteSeleccionado}&estructura=${estructuraSeleccionada}`,
        tablaHTML: patologiaDisponibles,
         onSelect: async(patologia) => {
            patologiaSeleccionada = patologia;
            rellenarExploracion();
        },
        addButtonId: "btnAddPatologia",
        input: newPatologia
    });
}

btnAceptarNuevaPatologia.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newPatologia.value == '') return;
    await createPatologia(proyectoSeleccionado, corteSeleccionado, zonaSeleccionada, estructuraSeleccionada, newPatologia.value);
    newPatologia.value = '';
    windowNewPatologia.classList.add("hidden");
    await rellenarPatologia();
});
windowPatologia.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnAceptarNuevaPatologia.click();
    }
});

btnCancelarNuevaPatologia.addEventListener('click', (e) => {
    e.stopPropagation();
    windowNewPatologia.classList.add("hidden");
    const btnAddPatologia = document.getElementById("btnAddPatologia");
    btnAddPatologia.classList.remove("active");
    activarEl(patologiaDisponibles);

});


//-----------Exploracion-----------
async function rellenarExploracion() {
    windowExploracion.classList.remove("hidden");
    rellenar({
        window: windowNewExploracion,
        api: `/api/exploraciones?proyecto=${proyectoSeleccionado}&zona=${zonaSeleccionada}&corte=${corteSeleccionado}&estructura=${estructuraSeleccionada}&patologia=${patologiaSeleccionada}&exploracion=${exploracionSeleccionada}`,
        tablaHTML: exploracionDisponibles,
         onSelect: async(exploracion) => {
            exploracionSeleccionada = exploracion;
            if(proyectoSeleccionado == 'CERP'){
                mostrarSelecciones();
            } else {
                rellenarOrientacion();
            }
        },
        addButtonId: "btnAddExploracion",
        input: newExploracion
    });
}

btnAceptarNuevaExploracion.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newExploracion.value == '') return;
    await createExploracion(proyectoSeleccionado, corteSeleccionado, zonaSeleccionada, estructuraSeleccionada, patologiaSeleccionada, newExploracion.value);
    newExploracion.value = '';
    windowNewExploracion.classList.add("hidden");
    await rellenarExploracion();
});
windowExploracion.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        btnAceptarNuevaExploracion.click();
    }
});

btnCancelarNuevaExploracion.addEventListener('click', (e) => {
    e.stopPropagation();
    windowNewExploracion.classList.add("hidden");
    const btnAddExploracion = document.getElementById("btnAddExploracion");
    btnAddExploracion.classList.remove("active");
    activarEl(exploracionDisponibles);

});


//-----------Archivos selecccionados-----------
async function mostrarSelecciones() {
    console.log(orientacionSeleccionada)
    if (orientacionSeleccionada== '') {
        orientacionSeleccionada = 'CERP';
        try {
            await createOrientacion(proyectoSeleccionado, corteSeleccionado, zonaSeleccionada, estructuraSeleccionada, orientacionSeleccionada, patologiaSeleccionada, exploracionSeleccionada);
        } catch (err) {}
    }
    const resImg = await fetch(`/api/images?proyecto=${proyectoSeleccionado}&zona=${zonaSeleccionada}&corte=${corteSeleccionado}&estructura=${estructuraSeleccionada}&orientacion=${orientacionSeleccionada}&patologia=${patologiaSeleccionada}&exploracion=${exploracionSeleccionada}`);
    if (!resImg.ok) {
        alert("Error loading list of images");
        return;
    }
    const images = await resImg.json();
    //Preparacion de la ventana:
    mapaWindow.classList.remove("hidden");            
    mapaWindow.style.display = "flex";
    mapaWindow.style.flexDirection = "column";
    titleMapa.textContent = `${proyectoSeleccionado}: ${zonaSeleccionada} ${corteSeleccionado} ${estructuraSeleccionada} ${orientacionSeleccionada}`;
    mapaFileInput.value= '';
    mapaText.replaceChildren();
    listaMascaras.innerHTML='';
    if (proyectoSeleccionado != 'SF' && proyectoSeleccionado != 'SP'){
        //Recuperacion de BBDD Mapa y Mascaras si existen:
        if(images[0]) { 
            mostrarMapa(images[0], true)
        }
        if(images[1]) {
            nombreMascaras = images[1] ;
            nombreMascaras.forEach(mask => {
                mostrarMascaras(mask, null, true);
            });
        }
    }
    else {
        contenedorVideo.style.display = "flex";
        videoFileInput.value= '';
        videoText.replaceChildren();
        //Recuperacion de BBDD Mapa y Mascaras si existen:
        if(images[0]) { 
            mostrarMapa(images[0], true)
        }
        if(images[1]) {
            mostrarVideo(images[1], true)
        }
        if(images[2]) {
            nombreMascaras = images[2] ;
            nombreMascaras.forEach(mask => {
                mostrarMascaras(mask, null, true);
            });
        }
    }
}

mapaFileInput.addEventListener("change", (e) => {
    mapaSeleccionado = e.target.files[0];
    if (!mapaSeleccionado) return;
    if (!mapaSeleccionado.name.endsWith(".svg")) {
        alert("Introduzca archivos de tipo .svg");
        return;
    }
    mostrarMapa(mapaSeleccionado.name);
});

videoFileInput.addEventListener("change", (e) => {
    videoSeleccionado = e.target.files[0];
    if (!videoSeleccionado) return;
    if (!videoSeleccionado.name.endsWith("mp4")) {
        alert("Introduzca archivos de tipo .mp4");
        return;
    }
    mostrarVideo(videoSeleccionado.name);
});

mascaraFileInput.addEventListener("change", (e) => {
    let mask = e.target.files[0];
    if (!mask) return;
    if (!mask.name.endsWith(".svg")) {
        alert("Introduzca archivos de tipo .svg");
        return;
    }
    const existe = nombreMascaras.some(nombre => nombre === mask.name);
    if (existe) {
        mascaraFileInput.value = "";
        alert("Archivo previamente añadido");
        return;
    }
    mascarasSeleccionadas.push(mask);
    nombreMascaras.push(mask.name);
    mostrarMascaras(mask.name, mask);
    mascaraFileInput.value = "";
});

btnAceptarImg.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (nombreMascaras.length===0) {
        warningMapa.classList.remove("hidden");
        mapaWindow.classList.add("disabled");
        return;
    }
    await guardarImg(mapaSeleccionado, mascarasSeleccionadas, proyectoSeleccionado, zonaSeleccionada, corteSeleccionado, orientacionSeleccionada, estructuraSeleccionada, patologiaSeleccionada, exploracionSeleccionada);
    closeAllPanels();
});
btnCancelarImg.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllPanels();
});

btnWarn.addEventListener('click', (e) => {
    e.stopPropagation();
    warningMapa.classList.add('hidden');
    mapaWindow.classList.remove('disabled');
})


function mostrarMapa(nombreMapa, guardado = false) {
    mapaText.textContent = nombreMapa;
    const btnDelete = document.createElement("button");
    btnDelete.textContent = "X";
    btnDelete.classList.add("eliminar");
    btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (guardado) {
            await eliminarImagenes(nombreMapa, "mapa", proyectoSeleccionado);
            images[0] = null;
        }
        mapaSeleccionado = null;
        mapaFileInput.value = "";
        mapaText.replaceChildren();
    });
    mapaText.appendChild(btnDelete);
}

function mostrarVideo(nombreVideo, guardado = false) {
    videoText.textContent = nombreVideo;
    const btnDelete = document.createElement("button");
    btnDelete.textContent = "X";
    btnDelete.classList.add("eliminar");
    btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (guardado) {
            await eliminarImagenes(nombreVideo, "video", proyectoSeleccionado);
            images[1] = null;
        }
        videoSeleccionado = null;
        videoFileInput.value = "";
        videoText.replaceChildren();
    });
    videoText.appendChild(btnDelete);
}

function mostrarMascaras (maskName, maskFile = null, guardada = false) {
    const divMask = document.createElement("div");
    divMask.textContent = maskName;
    const btnDelete = document.createElement("button");
    btnDelete.textContent = "X";
    btnDelete.classList.add("eliminar");
    btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation();
        if(maskFile) {
            mascarasSeleccionadas = mascarasSeleccionadas.filter(m => m !== maskFile);
        }
        nombreMascaras = nombreMascaras.filter(nombre => nombre !== maskName);
        if(guardada){
            await eliminarImagenes(maskName, "mask", proyectoSeleccionado)
        }
        divMask.remove();
        mascaraFileInput.value = "";
    });
    listaMascaras.appendChild(divMask);
    divMask.appendChild(btnDelete);
}



//------Descarga------
downloadBtn.addEventListener("click", ()=> {
    window.location.href = "/download";
});

//------------------POSTGRESQL------------------
async function createProyecto(proyecto) {
    const response = await fetch('/crearProyecto', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(proyecto)
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function createZone(zona) {
    const response = await fetch('/crearZona', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"zona": zona, "proyecto": proyectoSeleccionado})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function createCorte(proyecto, corte, zona) {
    const response = await fetch('/crearCorte', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"proyecto": proyecto, "name": corte, "zona": zona})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function createEstructura(proyecto, corte, zona, nombre) {
    const response = await fetch('/crearEstructura', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"proyecto": proyecto, "corte": corte, "zona": zona, "nombre": nombre})
    })
    if(!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function createPatologia(proyecto, corte, zona, estructura, patologia) {
    const response = await fetch('/crearPatologia', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"proyecto": proyecto, "corte": corte, "zona": zona, "estructura": estructura, "patologia": patologia})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function createExploracion(proyecto, corte, zona, estructura, patologia, exploracion) {
    const response = await fetch('/crearExploracion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"proyecto": proyecto,"corte": corte, "zona": zona, "estructura": estructura, "patologia": patologia, "exploracion": exploracion})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}


async function createOrientacion(proyecto, corte, zona, estructura, orientacion, patologia, exploracion) {
    const response = await fetch('/crearOrientacion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"proyecto": proyecto, "corte": corte, "zona": zona, "estructura": estructura, "orientacion": orientacion, "patologia": patologia, "exploracion": exploracion})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function guardarImg(mapa, mascaras, proyecto, zona, corte, orientacion, estructura, patologia, exploracion) {
    const formData = new FormData();
    if (mapa) {
        formData.append("mapa", mapa);
    }
    mascaras.forEach(mask => {
        formData.append("mascaras", mask);
    });
    formData.append("proyecto", proyecto);
    formData.append("zona", zona);
    formData.append("corte", corte);
    formData.append("orientacion", orientacion);
    formData.append("estructura", estructura);
    formData.append("patologia", patologia);
    formData.append("exploracion", exploracion);

    const response = await fetch('/save', {
        method: 'POST',
        body: formData
    });
    const text = await response.text();
    console.log("RAW RESPONSE: ", text);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`);
    }
    const data = JSON.parse(text);
    console.log("Success:", data);
    
}


async function eliminarImagenes(svg_url, mapOrMask, proyecto) {
    const response = await fetch('/deleteImg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"mapOrMask": mapOrMask, "svg_url": svg_url, "proyecto": proyecto})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}
