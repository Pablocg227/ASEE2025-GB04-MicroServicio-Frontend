# Music Albums App

Este proyecto es una aplicación de frontend construida con React que permite visualizar los álbumes y canciones de un artista. La aplicación está diseñada para ser fácil de usar y proporciona una interfaz intuitiva para explorar la música.

## Estructura del Proyecto

El proyecto tiene la siguiente estructura de archivos:

```
music-albums-app
├── public
│   └── index.html          # Plantilla HTML principal
├── src
│   ├── index.jsx           # Punto de entrada de la aplicación
│   ├── App.jsx             # Componente principal que gestiona el estado
│   ├── components          # Componentes de la aplicación
│   │   ├── AlbumList.jsx   # Componente para mostrar la lista de álbumes
│   │   ├── AlbumCard.jsx    # Componente para mostrar un álbum individual
│   │   ├── SongList.jsx     # Componente para mostrar la lista de canciones
│   │   └── Artist.jsx       # Componente para mostrar información del artista
│   ├── services            # Servicios para interactuar con la API
│   │   └── api.js          # Funciones para obtener datos de álbumes y canciones
│   ├── styles              # Estilos CSS de la aplicación
│   │   └── App.css         # Estilos globales y específicos
│   └── utils               # Funciones de utilidad
│       └── helpers.js      # Funciones para formatear datos
├── package.json            # Configuración de npm y dependencias
└── README.md               # Documentación del proyecto
```

## Instalación

Para instalar las dependencias del proyecto, ejecuta el siguiente comando en la raíz del proyecto:

```
npm install
```

## Ejecución

Para iniciar la aplicación en modo de desarrollo, utiliza el siguiente comando:

```
npm start
```

La aplicación se abrirá en tu navegador en `http://localhost:3000`.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.