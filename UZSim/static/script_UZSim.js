const cuerpo = document.getElementById("cuerpo");
const buttonContainer = document.getElementById("buttonContainer");
const btnEco = document.getElementById("btnEco");
const btnFisio = document.getElementById("btnFisio");
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

/*const windowOrientacion = document.getElementById("windowOrientacion");
const orientacionDisponibles = document.getElementById("orientacionDisponibles");
const windowNewOrientacion = document.getElementById("windowNewOrientacion");
const btnAddOrientacion = document.getElementById("btnAddOrientacion");
const newOrientacion = document.getElementById("newOrientacion");
const btnAceptarNuevaOrientacion = document.getElementById("btnAceptarNuevaOrientacion");
const btnCancelarNuevaOrientacion = document.getElementById("btnCancelarNuevaOrientacion");
let orientacionSeleccionada="";*/

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
const btnAceptarImg = document.getElementById("btnAceptarImg");
const btnCancelarImg = document.getElementById("btnCancelarImg");

const warningMapa = document.getElementById("warningMapa");
const btnWarn = document.getElementById("btnWarn");


//Seleccion apartado
function selectOption(option) {
    if (option === 'CERF') {
        proyectoSeleccionado = option;
        createProyecto(option);
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
    /*if (!windowZona.contains(e.target) 
        && !windowNewCorte.contains(e.target)
        && !windowNewOrientacion.contains(e.target)
        && !mapaWindow.contains(e.target)
        && !warningMapa.contains(e.target)) {
        closeAllPanels();
    }*/
    if (!windowZona.contains(e.target) 
        && !windowNewCorte.contains(e.target)
        && !mapaWindow.contains(e.target)
        && !warningMapa.contains(e.target)) {
        closeAllPanels();
    }
});

function closeAllPanels() {
    windowZona.classList.add("hidden");
    windowCortes.classList.add("hidden");
    windowNewCorte.classList.add("hidden");
    /*windowOrientacion.classList.add("hidden");
    windowNewOrientacion.classList.add("hidden");*/
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
    /*const btnAddOrientacion = document.getElementById("btnAddOrientacion");
    if (btnAddOrientacion) {
        btnAddOrientacion.disabled=false;
        btnAddOrientacion.classList.remove("disabled", "active");
    }*/
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
    /*orientacionDisponibles.querySelectorAll("div")?.forEach(el => {
        el.classList.remove("disabled");
        el.disabled = false;
        el.style.background = "transparent";
        el.style.color = "#4B5563";
    });*/
    zonaSeleccionada = '';
    corteSeleccionado = '';
    //orientacionSeleccionada = '';
    mapaSeleccionado = null;
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



btnFisio.onclick = async () => {
    selectOption('CERF');
    rellenarZonas();
}

//-----------Zonas-----------
async function rellenarZonas () {
    const resZonas = await fetch("/api/zonas");
    if (!resZonas.ok) {
        alert("Error loading list of zones");
        return;
    }
    const zonas = await resZonas.json();
    zonasCuerpo.innerHTML = ""; //Limpia si ya se habia rellenado en la ejecucion (tambien elimina el boton de añadir)
    zonas.forEach(zona => {
        const divZona = document.createElement("div");
        divZona.textContent = zona;
        divZona.style.cursor = "pointer";
        divZona.addEventListener("click", async (e) => {
            e.stopPropagation();
            desactivarEl(zonasCuerpo, btnAddZona);
            divZona.style.background = "#14b8a6";
            divZona.style.color = "#1f2937"
            divZona.classList.remove("disabled");
            zonaSeleccionada = zona;
            await rellenarCortes();
        });
        zonasCuerpo.appendChild(divZona);
    });
    const btnAddZona = document.createElement("button");
    btnAddZona.id = "btnAddZona";
    btnAddZona.textContent = "Añadir";
    btnAddZona.addEventListener('click', (e) => {
        e.stopPropagation();
        desactivarEl(zonasCuerpo, btnAddZona);
        btnAddZona.classList.add("active");
        btnAddZona.classList.remove("disabled");
        windowZona.classList.remove("hidden");
        newZone.focus();
    });
    zonasCuerpo.appendChild(btnAddZona);
}

btnAceptarNuevaZona.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newZone.value == '') return;
    await createZone(newZone.value);
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
    const resCortes = await fetch(`/api/cortes?zona=${zonaSeleccionada}`)
    if (!resCortes.ok) {
        alert("Error loading list of cuts");
        return;
    }
    const cortes = await resCortes.json();
    cortesDisponibles.innerHTML = ""; //Limpia si ya se habia rellenado en la ejecucion (tambien elimina el boton de añadir)
    cortes.forEach(corte => {
        const divCorte = document.createElement("div");
        divCorte.textContent = corte;
        divCorte.style.cursor = "pointer";
        divCorte.addEventListener("click", async(e) => {
            e.stopPropagation();
            desactivarEl(cortesDisponibles, btnAddCorte);
            divCorte.style.background = "#14b8a6";
            divCorte.style.color = "#1f2937"
            divCorte.classList.remove("disabled");
            corteSeleccionado = corte;
            mostrarSelecciones();
            // await rellenarOrientacion();
        });
        cortesDisponibles.appendChild(divCorte);
    });
    const btnAddCorte = document.createElement("button");
    btnAddCorte.id = "btnAddCorte";
    btnAddCorte.textContent = "Añadir";
    btnAddCorte.addEventListener('click', (e) => {
        e.stopPropagation();
        desactivarEl(cortesDisponibles, btnAddCorte);
        btnAddCorte.classList.add("active");
        btnAddCorte.classList.remove("disabled");
        windowNewCorte.classList.remove("hidden");
        newCorte.focus();
    });
    cortesDisponibles.appendChild(btnAddCorte);
}

btnAceptarNuevoCorte.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newCorte.value == '') return;
    await createCorte(proyectoSeleccionado, newCorte.value, zonaSeleccionada);
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


//-----------Archivos selecccionados-----------
async function mostrarSelecciones() {
    const resImg = await fetch(`/api/images?proyecto=${proyectoSeleccionado}&zona=${zonaSeleccionada}&corte=${corteSeleccionado}`);
    if (!resImg.ok) {
        alert("Error loading list of images");
        return;
    }
    const images = await resImg.json();

    mapaWindow.classList.remove("hidden");            
    mapaWindow.style.display = "flex";
    mapaWindow.style.flexDirection = "column";
    titleMapa.textContent = `${proyectoSeleccionado}: ${zonaSeleccionada} ${corteSeleccionado}`;
    listaMascaras.innerHTML='';

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

mapaFileInput.addEventListener("change", (e) => {
    mapaSeleccionado = e.target.files[0];
    if (!mapaSeleccionado) return;
    if (!mapaSeleccionado.name.endsWith(".svg")) {
        alert("Introduzca archivos de tipo .svg");
        return;
    }
    mostrarMapa(mapaSeleccionado.name);
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
    await guardarImg(mapaSeleccionado, mascarasSeleccionadas, proyectoSeleccionado, zonaSeleccionada, corteSeleccionado);
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
    mapaText.replaceChildren();
    mapaText.textContent = nombreMapa;
    const btnDelete = document.createElement("button");
    btnDelete.textContent = "X";
    btnDelete.classList.add("eliminar");
    btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (guardado) {
            await eliminarImagenes(nombreMapa, "mapa");
            images[0] = null;
        }
        mapaSeleccionado = null;
        mapaFileInput.value = "";
        mapaText.replaceChildren();
    });
    mapaText.appendChild(btnDelete);
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
            await eliminarImagenes(maskName, "mask")
        }
        divMask.remove();
        mascaraFileInput.value = "";
    });
    listaMascaras.appendChild(divMask);
    divMask.appendChild(btnDelete);
}


//-----------Orientacion-----------
/*async function rellenarOrientacion() {
    windowOrientacion.classList.remove("hidden");
    const resOrientacion = await fetch(`/api/orientaciones?zona=${zonaSeleccionada}&corte=${corteSeleccionado}`);
    if (!resOrientacion.ok) {
        alert("Error loading list of orientations");
        return;
    }
    const orientaciones = await resOrientacion.json();
    orientacionDisponibles.innerHTML = ""; //Limpia si ya se habia rellenado en la ejecucion (tambien elimina el boton de añadir)
    orientaciones.forEach(orientacion => {
        const divOrientacion = document.createElement("div");
        divOrientacion.textContent = orientacion;
        divOrientacion.style.cursor = "pointer";
        divOrientacion.addEventListener("click", async(e) => {
            e.stopPropagation();
            desactivarEl(orientacionDisponibles, btnAddOrientacion);
            divOrientacion.style.background = "#14b8a6";
            divOrientacion.style.color = "#1f2937"
            divOrientacion.classList.remove("disabled");
            orientacionSeleccionada = orientacion;
            // await ();
        });
        orientacionDisponibles.appendChild(divOrientacion);
    });
    const btnAddOrientacion = document.createElement("button");
    btnAddOrientacion.id = "btnAddOrientacion";
    btnAddOrientacion.textContent = "Añadir";
    btnAddOrientacion.addEventListener('click', (e) => {
        e.stopPropagation();
        desactivarEl(orientacionDisponibles, btnAddOrientacion);
        btnAddOrientacion.classList.add("active");
        btnAddOrientacion.classList.remove("disabled");
        windowNewOrientacion.classList.remove("hidden");
        newCorte.focus();
    });
    orientacionDisponibles.appendChild(btnAddOrientacion);
}

btnAceptarNuevaOrientacion.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newOrientacion.value == '') return;
    await createOrientacion(proyectoSeleccionado, corteSeleccionado, zonaSeleccionada, newOrientacion.value);
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

});*/




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
        body: JSON.stringify(zona)
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

async function createOrientacion(proyecto, corte, zona, orientacion) {
    const response = await fetch('/crearOrientacion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"proyecto": proyecto, "name": corte, "zona": zona, "orientacion": orientacion})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function guardarImg(mapa, mascaras, proyecto, zona, corte) {
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


async function eliminarImagenes(svg_url, mapOrMask) {
    const response = await fetch('/deleteImg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({"mapOrMask": mapOrMask, "svg_url": svg_url})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}
