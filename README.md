# uzqtool

## DRAW nuevo <u>`directorio estructuraGral` </u>

En el servidor <u>`directorio New-Projects`</u>

Todos los nuevos proyectos se ejecutan en el puerto 5004. Se ha programado de manera que sea flexible para diferentes proyectos de ecografía, de ecografía general y de RM.

## <u>`directorio Tendon-Long`</u>

1. **`app.py`** crea una instancia de la aplicación Flask.
    - Cuando se accede a la raíz ("/"), Flask devuelve el archivo **`templates/index.html`**.
    - Cuando se accede a imágenes ("/images") devuelve los nombres de los archivos presentes en el directorio static/echographies
    - Cuando se accede a "/save", esta ruta recibe una solicitud POST con datos que serán procesados y guardados. Recibe datos en formato JSON desde el frontend y los decodifica (datos de la imagen y metadatos como nb, evaluador, calidad, respuestas y zonas).
        Después guarda la imagen en el directorio static/DATA/nombre.

        Crea o lee el archivo static/SATA/file_info.json donde añade los datos decodificados del request de JSON con las variables y el formato adecuado, y los guarda.

        Devuelve al frontend un mensaje para indicar que ha sido correcto.

    - Por último ajecuta la aplicación en host 0.0.0.0:5003 (para pruebas en local 127.0.0.0:5003).

2. **`templates/index.html`** le da el estilo presente en **`static/styles.css`** (gracias al método de Flask url_for) y carga un favicon personalizado (static/favicon.ico).

    Crea un panel derecho con botones de calidad de la imagen. Permite seleccionar la zona anátomica (radio) y modificar el grosor del pincel (ranges). También permite seleccionar respuestas en un pequeño cuestionario (radios). Por último tiene un botón de guardar inicialmente deshabilitado.

    En la parte principal hay varios botones (muestra aleatoria, empezar, y borrar), hay un canvas que tendra el fondo con la imagen que se haya cargado. Para ello también se crea un <img>

    Finalmente hay un sript que Flask carga con url_for, localizado en **`static/scripts.js`**

3. **`static/scripts.js`** inicializa las variables y los campos que se van han definido en el html, se carga la imagen en el canva con dimensiones especificadas. Añade events listeners a los elementos inicializados, y define las funciones que van a llamar estos listeners: 
    - getRandomSample: pide el nombre del evaluador, y llama a la web /images (GET), definida en app.py, que devolvia un Json con los files presentes en el directorio static/echographies. Recoge esta respuesta y selecciona una muestra aleatoria de 10 imagenes. Una vez hecho esto, se acivan y desactivan los botones de empezar y de generar muestra aleatoria, respectivamente.
    
    - startLoading: función llamada si se selecciona su botón. Si hay imágenes seleccionadas por el método anterior, llama al método loadNextImage (explicado posteriormente) habilita el elemento con id "saveDrawing" y el botón de limpiar imagen. Da contenido de texto a este botón para que muestre el número de la imagen inicial del listado de 10. Deshabilita este botón y el botón de getRandomSample.
    
    - loadNextImage: mientras siga habiendo elementos en la lista de 10, muestra la imagen que corresponda, muestra su número dentro del listado en el botón startLoadingButton. Establece todos los parámetros iniciales:
        
        A los botones de calidad (definidos en tenplates/index.html, como elementos de clase buttons, no como botones) les quita la propiedad "active" (styles.css). Guarda la quality inicial en una variable con valor inicial nulo.

        El menú de la derecha se vuelve visible, y habilita todos los inputs y botones que tiene (definidos en html como inputs y buttons).

        Los inputs con nombre zone en el html, se deseleccionan. Guarda la zona inicial en una variable con valor inicial nulo. Selecciona todos los label dentro de los elementos zone-selection > options, y elimina su propiedad selected (styles.css).

        Si ya se han alacanzado todos los elementos d ela lista, muestra una alerta de que la lista se ha completado, el texto del botón startLoadingButton muestra "Start" y se habilita el botón de seleccion de muestra random. Recarga la página (esta recarga hace que no sirva apra nada los cambios realizados en los botones ¿?).

    - saveDrawing: función llamada si se selecciona este botón. Este botón comprueba que se haya seleccionado la calidad de la imagen, la zona que se estudia y las cinco preguntas del cuestionario si la calidad de la imagen era buena. Si la calidad es mala, el cuestionario recoge las respuestas por defecto [0, 0, 0, 0, 0].

        Si la comprobación es correcta, procede a guardar el dibujo realizado sobre la imagen. Recorgar que en el momento en el que se carga la imagen (cosa que en realidad ocurre en loadNextImage) se establecen las características del elemento "drawingCanvas" con las características de la imagen. Pues en saveDrawing se va a generar un nuevo elemento desde código llamado "canvas" con las características del anterior, donde se van a dibujar todo lo que contuviera, incluidas las interacciones realizadas por el usuario. Pasa esta informacion a DataURL y guarda el timestamp. 

        Llama a la web /save (GET), definida en app.py, para hacer un POST (envío de datos). El cuerpo se envía en formato jSON ({'Content-Type': 'application/json'}). Convierte el objeto con todos los datos acerca de la imagen, su nombre original, su nombre como timestamp, la calidad, la zona, el evaluador, el cuestionario, a una cadena JSON. Convierte el cuerpo de la respuesta del servidor en un objeto JavaScript, si la respuesta es un código de error (≥ 400), lanza un error y salta al catch. Si la respuesta (data) es correcta llama a loadNextImage, incrementa el contador de dibujos guardados (aunque parece que es una variable que no se usa) y llama a la función resetQuestionnaire.

    - resetQuestionnaire: se ejecuta cuand el guardado se ha realizado correctamente. Resetea el formulario "questionnaire" del html y elimina la propiedad selected (styles.css) a todos los labels dentro de options.

    - clearDrawing: modificar el contexto del canvas de manera que limpia todo el contenido del canvas, incluida la imagen. Recarga la imagen en el canvas. Resetea el indice del color a utilizar en el pincel (cada color es una estructura diferente).
    
    Posteriormente el código define los eventos del canvas tanto para reaccionar al ratón como a una pantalla táctil:

    - startDrawing: establece un bool como true (drawing) y llama a la funcion draw.

    - draw: si drawing es false, no hace nada. Si no, establece el ancho y el color del pincel (que irá cambiando en cada stopDrawing) y realiza el dibujo en el ctx del canvas recibiendo las coordenadas a través de las funciones getMousePos o getTouchPos (ratón o táctil). Esta funcion se llama de forma constante mientras haya eventos, es un listener constante. moveTo establece el punto inicial del contexto, lineTo establece al punto al que se tiene que dibujar desde el punto inicial. Además guarda en un array (drawingData) cada punto donde el usuario está dibujando, almacenando las coordenadas x e y del cursor o del toque.

    - stopDrawing: pasa el bool drawing a false, y cambia el indice del color dentro de la lista de colores (definida inicialmente como ['cyan', 'magenta','magenta', 'yellow']).

    En el código también se añade el evento "change" al elemento questionnaire del html que contiene elementos de clase "options" y de tipo input radio. Cuando se selecciona un input radio, deselecciona todos los labels dentro de ese grupo options, y le da la propiedad selected al label seleccionado (styles.css).

    Añade también el comportamiento de los sliders para el ancho del pincel de cada color, y le da este valor al elemento correspondiente según el color (${colors[index]}WidthValue). De esta manera con el mismo código se puede acceder a cyanWidthValue, magentaWidthValue, yellowWidthValue. Cuando se modifica el ancho, se limpia todo el dibujo (clearDrawing).

    También se define el funcionamiento como botones de aquellos elementos que no se han definido como tales en el html, pero que van a recibir eventos de click. Éstos son los botones de calidad y los de la zona. En esta definición de su funcionamiento también se guardan en variables los valores seleccionados como strings en minúsculas.

    Adicionalmente, para el botón de calidad rojo (bad), se añade una funcionalidad extra, que es que deshabilita la respuesta del resto de elementos del menú de la derecha, y visualmente modifica su transparencia para mostrarselo al usuairo. Solo permanece clicable el botón de guardar y los de calidad.

    Para los otros botones de calidad, se establece un listener para reactivar el menú de la derecha con la función enableRightMenu. Esta función reactiva los elementos que contiene el menú y reestablece la transparencia.


 ## <u>`directorio Tunnel-Long`</u>

1. **`app.py`** crea una instancia de la aplicación Flask. Todo igual que Tendon-Long/app.py, solo con ligeras diferencias en /save y en metadata.

    Cuando se accede a "/save", esta ruta recibe una solicitud POST con datos que serán procesados y guardados. Recibe datos en formato JSON desde el frontend y los decodifica. En este caso, son datos de la imagen y metadatos como nb, evaluador y calidad (no zonas ni respuestas). En static/SATA/file_info.json añade estos datos decodificados del request de JSON con las variables y el formato adecuado, y los guarda.

    Ejecuta la aplicación en host 0.0.0.0:5001 (para pruebas en local 127.0.0.0:5001).

2. **`templates/index.html`** le da el estilo presente en **`static/styles.css`** de la misma manera que en la app anterior.

    Crea un panel derecho con botones de calidad de la imagen. Permite modificar el grosor de los pinceles (ranges) que harán referencia a cada una de las zonas  dibujar. No tiene cuestionario. Por último tiene un botón de guardar inicialmente deshabilitado.

    Igual que en la anterior app, en la parte principal hay varios botones (muestra aleatoria, empezar, y borrar), hay un canvas que tendra el fondo con la imagen que se haya cargado. Para ello también se crea un <img>

    Finalmente hay un sript que Flask carga con url_for, localizado en **`static/scripts.js`**

3. **`static/scripts.js`** es exactamente igual al scripts.js de la app anterior con la diferencia de que no tiene que manejar ni el guardado ni el comportamiento del cuestionario ni de los botones de zonas.

 ## <u>`directorio Tunnel-Trans`</u>

1. **`app.py`** crea una instancia de la aplicación Flask. Exactamente igual que Tunnel-Long, pero en el puerto 5002.

2. **`templates/index.html`** le da el estilo presente en **`static/styles.css`** de la misma manera que en las apps anteriores. Es exactamente igual a Tunnel-Long, excepto porque necesita de un slider más con otro color (habrá que dibujar una zona más). 

3. **`static/scripts.js`** es exactamente igual al scripts.js de Tunnel-Long solo que con un slider programado más.