
from pathlib import Path
import pandas as pd

# Rutas
raiz = Path(__file__).resolve().parents[2]

ruta_reviews = raiz / "database/data/raw/amazon_reviews_MuMu.json"
ruta_albumes = raiz / "database/data/procesada/albumes.json"
ruta_salida = raiz / "database/data/procesada/reviews.json"

# Leer datasets
df_reviews = pd.read_json(ruta_reviews, lines=True)
df_albumes = pd.read_json(ruta_albumes)

print("--- DATASET ORIGINAL ---")
print("Reseñas:", len(df_reviews))

# 1. Validar campos necesarios
campos_obligatorios = ["reviewerID", "amazon_id", "reviewText", "overall"]

for campo in campos_obligatorios:
    if campo not in df_reviews.columns:
        raise ValueError(f"Falta el campo obligatorio: {campo}")

# 2. Eliminar reseñas sin información esencial
sin_id = df_reviews["amazon_id"].isna()
sin_texto = (
    df_reviews["reviewText"].isna()
    | df_reviews["reviewText"].astype("string").str.strip().eq("")
)
sin_puntuacion = df_reviews["overall"].isna()

invalidas = sin_id | sin_texto | sin_puntuacion

print("\n--- VALIDACIONES ---")
print("Sin amazon_id:", sin_id.sum())
print("Sin texto:", sin_texto.sum())
print("Sin puntuación:", sin_puntuacion.sum())

df_reviews = df_reviews.loc[~invalidas].copy()

# 3. Validar puntuaciones
df_reviews["overall"] = pd.to_numeric(
    df_reviews["overall"], errors="coerce"
)

df_reviews = df_reviews.loc[
    df_reviews["overall"].between(1, 5)
].copy()

# 4. Conservar únicamente reseñas de álbumes del catálogo
ids_albumes = set(df_albumes["amazon_id"].dropna().astype(str))

df_reviews["amazon_id"] = df_reviews["amazon_id"].astype(str)

sin_album = ~df_reviews["amazon_id"].isin(ids_albumes)

print("Sin álbum asociado al catálogo:", sin_album.sum())

df_reviews = df_reviews.loc[~sin_album].copy()

# 5. Seleccionar los campos que utilizaremos
campos_finales = [
    "reviewerID",
    "reviewerName",
    "amazon_id",
    "reviewText",
    "overall",
    "summary",
    "helpful",
    "unixReviewTime",
    "reviewTime"
]

campos_disponibles = [
    campo for campo in campos_finales
    if campo in df_reviews.columns
]

reviews = df_reviews[campos_disponibles].copy()

reviews_comparacion = reviews.copy()

reviews_comparacion["helpful"] = (
    reviews_comparacion["helpful"].apply(
        lambda x: tuple(x) if isinstance(x, list) else x
    )
)

# 6. Comprobar duplicados exactos
duplicados = reviews_comparacion.duplicated().sum()

print("Reseñas duplicadas exactamente:", duplicados)


print("\n--- IDENTIFICACIÓN DE RESEÑAS ---")

print(
    "Usuarios diferentes:",
    reviews["reviewerID"].nunique()
)

print(
    "Álbumes reseñados:",
    reviews["amazon_id"].nunique()
)

print(
    "Combinaciones usuario-álbum repetidas:",
    reviews.duplicated(
        subset=["reviewerID", "amazon_id"]
    ).sum()
)

# No eliminamos duplicados automáticamente:
# primero inspeccionamos si realmente son registros repetidos.

# 7. Preparar criterios de selección

# Cantidad de votos que consideran útil la reseña
reviews["votos_utiles"] = reviews["helpful"].apply(
    lambda x: x[0] if isinstance(x, list) and len(x) > 0 else 0
)

# Convertir fecha Unix para poder ordenar
reviews["unixReviewTime"] = pd.to_numeric(
    reviews["unixReviewTime"], errors="coerce"
)

# 8. Ordenar reseñas por utilidad y fecha
reviews = reviews.sort_values(
    by=["amazon_id", "votos_utiles", "unixReviewTime"],
    ascending=[True, False, False]
)

# 9. Seleccionar máximo dos reseñas por álbum
reviews = (
    reviews.groupby("amazon_id", sort=False)
    .head(2)
    .copy()
)

# Eliminar columna auxiliar
reviews = reviews.drop(columns=["votos_utiles"])

# 10. Estadísticas de selección
cantidad_por_album = reviews.groupby("amazon_id").size()

print("\n--- SELECCIÓN FINAL ---")
print("Álbumes con reseñas:", len(cantidad_por_album))
print("Reseñas seleccionadas:", len(reviews))
print("Álbumes con una reseña:", (cantidad_por_album == 1).sum())
print("Álbumes con dos reseñas:", (cantidad_por_album == 2).sum())


# 11. Exportar
reviews.to_json(
    ruta_salida,
    orient="records",
    indent=2,
    force_ascii=False
)

print("\n--- RESULTADO FINAL ---")
print("Reseñas conservadas:", len(reviews))
print("Archivo generado:", ruta_salida)

print("\n--- CALIDAD DE LOS DATOS ---")

print(
    "Puntuaciones fuera de rango:",
    (~reviews["overall"].between(1, 5)).sum()
)

print(
    "Reseñas sin reviewerID:",
    reviews["reviewerID"].isna().sum()
)

print(
    "Reseñas sin fecha Unix:",
    reviews["unixReviewTime"].isna().sum()
)