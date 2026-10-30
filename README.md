git # Tp-integrador-Base-de-datos-Disqueria
Disquería: catálogos de álbumes, lista de favoritos del usuario y compra.

link a documentacion: https://docs.google.com/document/d/1uHZjJD3Udt9dtYm92ojBpsg78fzEv9_YPbbJnkKIL9Y/edit?usp=sharing 

Dentro de la carpeta database > data > procesada:
-albumes.json = archivo con los albumes con genero y artista ordenados y limpiados
-reviews.json = archivo con las reseñas de los albumes, mongo le asigna id automatico,
referencia con amazon_id al album. Con el fin de acortar tamaño del archivo reviews.json
se redujo la cantidad de reseñas a maximo 2 por album.
Ojo que hay albumes que ya venian
con 1 unica reseña.