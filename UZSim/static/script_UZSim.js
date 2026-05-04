const cuerpo = document.getElementById("cuerpo");
const buttonContainer = document.getElementById("buttonContainer");
const btnEco = document.getElementById("btnEco");
const btnFisio = document.getElementById("btnFisio");
const btnSimFisio = document.getElementById("btnSimFisio");
const btnSimPatol = document.getElementById("btnSimPatol");

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


//Seleccion apartado
function selectOption(option) {
    if (option === 'fisio') {
        buttonContainer.style.display = "none";
        cuerpo.style.display = "flex";
        cuerpo.style.flexDirection = "column";
        cuerpo.style.justifyContent = "start";
        cuerpo.style.alignItems = "start";
        content.style.display = "block";
    }
}


//------------------APRENDIZAJE FISIO------------------
document.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!windowZona.contains(e.target) && !windowCortes.contains(e.target) && !windowNewCorte.contains(e.target) && e.target.id !== "btnAddCorte") {
        closeAllPanels();
    }
});

function closeAllPanels() {
    windowZona.classList.add("hidden");
    windowCortes.classList.add("hidden");
    windowNewCorte.classList.add("hidden");
    const btnAddZona = document.getElementById("btnAddZona");
    if (btnAddZona) {
        btnAddZona.classList.remove("active");
        btnAddZona.disabled=false;
        btnAddZona.classList.remove("disabled");
    }
    const btnAddCorte = document.getElementById("btnAddCorte");
    if (btnAddCorte) {
        btnAddCorte.classList.remove("active");
        btnAddCorte.disabled=false;
        btnAddCorte.classList.remove("disabled");
    }
    zonasCuerpo.querySelectorAll("div").forEach(el => {
        el.classList.remove("disabled");
        el.disabled =false;
    });
}

btnFisio.onclick = async () => {
    selectOption('fisio');
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
            zonasCuerpo.querySelectorAll("div").forEach(el => {
                el.style.background = "transparent";
                el.style.color = "#4B5563";
                el.classList.add("disabled");
                el.disabled =true;
                btnAddZona.disabled=true;
                btnAddZona.classList.add("disabled");
            });
            divZona.style.background = "#14b8a6";
            divZona.style.color = "#1f2937"
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
        zonasCuerpo.querySelectorAll("div").forEach(el => {
            el.style.background = "transparent";
            el.style.color = "#4B5563";
            el.classList.add("disabled");
            el.disabled =true;
            btnAddZona.disabled=true;
            btnAddZona.classList.add("disabled");
        });
        btnAddZona.classList.add("active");
        windowZona.classList.remove("hidden");
        newZone.focus();
    });
    zonasCuerpo.appendChild(btnAddZona);
}

btnAceptarNuevaZona.addEventListener('click', async() => {
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
    if (btnAddZona) {
        btnAddZona.classList.remove("active");
    }
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
            cortesDisponibles.querySelectorAll("div").forEach(el => {
                el.style.background = "transparent";
                el.style.color = "#4B5563";    
            })
            divCorte.style.background = "#14b8a6";
            divCorte.style.color = "#1f2937"
            corteSeleccionado = corte;
        });
        cortesDisponibles.appendChild(divCorte);
    });
    const btnAddCorte = document.createElement("button");
    btnAddCorte.id = "btnAddCorte";
    btnAddCorte.textContent = "Añadir";
    btnAddCorte.addEventListener('click', (e) => {
        e.stopPropagation();
        btnAddCorte.classList.add("active");
        windowNewCorte.classList.remove("hidden");
        newCorte.focus();
    });
    cortesDisponibles.appendChild(btnAddCorte);
}

btnAceptarNuevoCorte.addEventListener('click', async(e) => {
    e.stopPropagation();
    if (newCorte.value == '') return;
    await createCorte(newCorte.value, zonaSeleccionada);
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
    if (btnAddCorte) {
        btnAddCorte.classList.remove("active");
    }
});



//------------------POSTGRESQL------------------
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

async function createCorte(corte, zona) {
    const response = await fetch('/crearCorte', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ "name": corte, "zona": zona})
    })
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}


