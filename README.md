# UZink + Electrolysis

Todos los nuevos proyectos de UZink se ejecutan en el puerto 5004. Se ha programado de manera que sea flexible para diferentes proyectos de ecografía, de ecografía general y de RM.

Electrolysis se ejecuta en el puerto 5005 y realiza las funciones de los proyectos de Manual UZqTool 1.0 (presentes en otro repositorio) pero con dibujo flexible similar a los proyectos de UZink.

## <u>Tendon-Long, Tunnel-Long y Tunnel-Trans</u>
Proyectos antiguos actualmente no funcionando, que se ejecutaban en el puerto 5003, 5001 y 5002 respectivamente.

A partir de imagenes ya presentes en el servidor, permite analizar muestras aleatorias de las mismas. 

Con pinceles de diferentes colores y grosores se pueden dibujar estructuras. Además hay un semáforo para indicar la calidad de la imagen, y otras cuestiones acerca de la calidad del tejido, morfología...

Las imagenes originales y las máscaras se encuentran en static/DATA, donde también se guarda la relación entre ambas y más metadatos en un json.

## <u>estructuraGral</u>
Proyectos de dibujo a mano alzada para delimitar diferentes tejidos y regiones de interés. Se ejeutan en el puerto 5004.

Permite cargar imagenes en diferentes formatos y videos tras haber sido procesados (/tools/generar_proxys.py). El usuario no sube los videos a la aplicacion y accede a ellos a través de la web, por lo que esta conversión se realiza manualmente a través del servidor.

El video está visible en todo momento, incluyendo tras la selección del frame de interés para permitir al usuario mantener el contexto de la imagen seleccionada.

Con pinceles de diferentes colores y grosores se pueden dibujar estructuras. Estos grosores se guardan en postgres para facilitar el trabajo de dibujo de cada estructura. También hay un semáforo para indicar la calidad de la imagen. No se recoge más información acerca de la calidad de la imagen.

Las imagenes originales y las máscaras se encuentran en static/DATA. Incialmente la relación entre ambas y más metadatos se guardaban en un json en el mismo directorio, pero generaba condición de carrera. Actualmente toda la información, tanto la guardada en el json como la actual, se guardan en la base de datos de postgres.

## <u>Electrolysis</u>
Proyecto para describir cuantitativamente el efecto de la electrólisis. Se ejeuta en el puerto 5005.

Permite cargar imagenes en diferentes formatos y videos tras haber sido procesados (/tools/generar_proxys.py). El usuario es quien sube las imagenes o videos, por lo que esta conversión se realiza durante la ejecución de la web.

El video está visible en todo momento, incluyendo tras la selección del frame de interés para permitir al usuario mantener el contexto de la imagen seleccionada.

Primero se selecciona un rectángulo de alto 1 cm del tejido real, para disponer de la escala de la imagen. Posteriormente se selecciona el threshold para transformar los grises y blanco y negro y ver exclusivamente la zona electrolizada. Por último se selecciona un rectángulo donde se encuentra la lesión.

Los cálculos que se realizan son los mismos que los realizados en el respositorio de los proyectos en PHP.

Las imagenes originales y las máscaras se encuentran en static/DATA. La relación entre ambas y más metadatos se guardan en la base de datos de postgres.
